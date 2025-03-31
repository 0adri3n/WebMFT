import os
import json
import subprocess
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "output"
MODS_FILE = "config/mods.json"

DATE_FORMAT = "%Y-%m-%d %H:%M:%S.%f"

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def load_mods():
    """Loads filtering rules from mods.json."""
    if not os.path.exists(MODS_FILE):
        return {}

    with open(MODS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def filter_csv(input_csv, output_csv, processing_mode):
    """Filters the CSV file based on exclusions defined in mods.json."""
    mods = load_mods()

    if processing_mode not in mods:
        print(f"Error: Mode '{processing_mode}' not found in mods.json")
        return

    df = pd.read_csv(input_csv, sep=',')

    for key, exclusions in mods[processing_mode].items():
        if key.startswith("Exclude") and isinstance(exclusions, list):
            column_name = key.replace("Exclude", "")  
            column_name = column_name[0].upper() + column_name[1:]  

            if column_name in df.columns:
                for exclusion in exclusions:
                    if exclusion.startswith("regex:"):
                        pattern = exclusion[6:]  
                        df = df[~df[column_name].astype(str).str.contains(pattern, regex=True)]
                    else:
                        df = df[~df[column_name].astype(str).isin([exclusion])]

        if key.startswith("Minimum") and isinstance(exclusions, (int, float)):
            column_name = key.replace("Minimum", "")
            column_name = column_name[0].upper() + column_name[1:]
            if column_name in df.columns and pd.api.types.is_numeric_dtype(df[column_name]):
                df = df[df[column_name] >= exclusions]

        if key.startswith("Maximum") and isinstance(exclusions, (int, float)):
            column_name = key.replace("Maximum", "")
            column_name = column_name[0].upper() + column_name[1:]

            if column_name in df.columns and pd.api.types.is_numeric_dtype(df[column_name]):
                df = df[df[column_name] <= exclusions]

        if key.startswith("Equal") and isinstance(exclusions, list):
            column_name = key.replace("Equal", "")
            column_name = column_name[0].upper() + column_name[1:]

            if column_name in df.columns:
                df = df[df[column_name].astype(str).isin([str(value) for value in exclusions])]

        if key.startswith("Before") or key.startswith("After") or key.startswith("OnDate"):

            column_name = key.replace("Before", "").replace("After", "").replace("OnDate", "")
            column_name = column_name[0].upper() + column_name[1:]

            if column_name in df.columns:
                try:
                    df[column_name] = pd.to_datetime(df[column_name], format=DATE_FORMAT, errors='coerce')
                    filter_date = pd.to_datetime(exclusions, format=DATE_FORMAT)

                    if key.startswith("Before"):
                        df = df[df[column_name] < filter_date]
                    elif key.startswith("After"):
                        df = df[df[column_name] > filter_date]
                    elif key.startswith("OnDate"):
                        df = df[df[column_name] == filter_date]

                except Exception as e:
                    print(f"Date conversion error: {e}")
    
    df.to_csv(output_csv, index=False)
    print(f"Filtered data saved to {output_csv}")

@app.route('/process', methods=['POST'])
def process_file():
    """Processes the MFT file and applies filtering according to the selected mode."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        output_name = request.form.get('outputName')
        processing_mode = request.form.get('processingMode')

        if file.filename == '':
            return jsonify({'error': 'Invalid file name'}), 400

        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        output_csv = os.path.join(app.config['OUTPUT_FOLDER'], output_name)

        file.save(file_path)  

        command = ["MFTECmd.exe", "-f", file_path, "--csv", "output", "--csvf", output_name]
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode != 0:
            return jsonify({'error': 'Processing error', 'details': result.stderr}), 500

        filter_csv(output_csv, output_csv, processing_mode)

        save_log(file.filename, output_name, os.path.getsize(output_csv), processing_mode)

        return jsonify({'message': 'Processing successful', 'output_file': output_name})

    except Exception as e:
        print(e)
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500

@app.route('/add-mod', methods=['POST'])
def add_mod():
    mod_data = request.get_json()

    with open('config/mods.json', 'r') as f:
        mods = json.load(f)

    new_mod = {
        "Description": mod_data['description'],
    }

    for exclusion in mod_data['exclusions']:
        column_name = exclusion['columnName']
        exclude_value = exclusion['excludeValue']
        
        exclusion_key = f"Exclude{column_name.capitalize()}"
        
        if exclusion_key not in new_mod:
            new_mod[exclusion_key] = []

        new_mod[exclusion_key].append(exclude_value)

    mods[mod_data['modName']] = new_mod

    with open('config/mods.json', 'w') as f:
        json.dump(mods, f, indent=4)

    return jsonify({"message": "Mod added successfully"}), 200

@app.route('/get-mods', methods=['GET'])
def get_mods():
    try:
        with open('config/mods.json', 'r') as f:
            mods = json.load(f)
        return jsonify(mods), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/save-mods', methods=['POST'])
def save_mods():
    try:
        mods_data = request.get_json()
        mods = mods_data['modsData']  

        with open('config/mods.json', 'w') as f:
            json.dump(mods, f, indent=4)

        return jsonify({"message": "Mods file saved successfully!"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

LOG_FILE = 'config/logs.json'

def load_logs():
    if not os.path.exists(LOG_FILE):
        return []
    with open(LOG_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_log(source_file, output_file, file_size, mode):
    log_entry = {
        "source_file": source_file,
        "output_file": output_file,
        "file_size": file_size,
        "mode": mode,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            try:
                logs = json.load(f)
                if not isinstance(logs, list):
                    logs = []
            except json.JSONDecodeError:
                logs = []
    else:
        logs = []

    logs.append(log_entry)

    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=4)

@app.route('/get-logs', methods=['GET'])
def get_logs():
    logs = load_logs()
    return jsonify(logs), 200

@app.route('/output/<filename>')
def download_file(filename):
    """Allows downloading an output file."""
    try:
        return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)
    except FileNotFoundError:
        return "File not found", 404

@app.route('/view_csv')
def view_csv():
    return render_template('view_csv.html')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
