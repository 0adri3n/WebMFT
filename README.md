# **WebMFT**  

<img src="https://github.com/0adri3n/bpp/blob/master/src/img/logo.PNG?raw=true" width=450></img>  

## 📸 **Screenshots**  

*(Ajoute ici des captures d'écran de ton projet pour illustrer son fonctionnement.)*  

---

## 🚀 **Overview**  

**WebMFT** is a powerful tool designed to process **Master File Table (MFT) files** efficiently. This project leverages **MFTECmd.exe** by **John Zimmerman** to extract and filter MFT records, offering users a clean web interface to manipulate and analyze the data.  

With **WebMFT**, you can:  

✅ **Upload an MFT file** and extract useful information.  
✅ **Apply powerful filters** to refine results (date, size, extension, etc.).  
✅ **View logs and processing results** directly from the web interface.  
✅ **Create custom processing modes** (called "Mods") to automate filtering.  

---

## 🎯 **Goal**  

The objective of **WebMFT** is to provide an easy-to-use **web interface** for forensic analysis of MFT records, allowing investigators, analysts, and cybersecurity professionals to process and filter large datasets with ease.  

---

## 🔗 **Live Demo**  

👉 *(If you have a hosted version, provide a link here! Otherwise, mention how to run it locally.)*  

---

## 🛠️ **How to Use?**  

1. **Upload an MFT file** through the interface.  
2. **Choose a processing mode** (or create your own Mod).  
3. **Run the processing** to extract and filter the data.  
4. **Download the filtered CSV file** or view results directly.  

---

## 🧩 **Filters Available**  

WebMFT supports **multiple filtering options** to refine MFT data:  

### 📁 **Exclusion Filters**  
Used to exclude certain files or directories from the results.  

```json
{
    "ExcludeExtension": [".log", ".tmp"],
    "ExcludeParentPath": ["regex:.*\\\\ProgramData\\\\.*", ".\\System Volume Information"],
    "ExcludeIsDirectory": ["True"]
}
```

### 🔢 **Value-Based Filters**  
Used to filter numeric values like size, timestamps, etc.  

```json
{
    "MinimumSize": 100,
    "MaximumSize": 5000,
    "EqualType": ["File"]
}
```

### 📅 **Date Filters**  
Used to filter records based on timestamps.  

```json
{
    "BeforeLastModified": "2023-12-31 23:59:59.999999",
    "AfterCreationDate": "2024-01-01 00:00:00.000000",
    "OnDateScanDate": "2024-09-12 08:27:26.419498"
}
```

⚠ **Date format must be** `YYYY-MM-DD HH:MM:SS.ffffff`.  

---

## 🛠 **How to Install & Run?**  

### 🔹 **Requirements**  
- Python 3.x  
- MFTECmd.exe (included in the project)  

### 🔹 **Setup Instructions**  

1️⃣ **Clone the repository**  

```sh
git clone https://github.com/YOUR_USERNAME/WebMFT.git
cd WebMFT
```

2️⃣ **Install dependencies**  

```sh
pip install -r requirements.txt
```

3️⃣ **Run the project**  

```sh
python app.py
```

4️⃣ **Open the web interface** in your browser at:  

```
http://127.0.0.1:5000
```

---

## ⚡ **How Does It Work?**  

WebMFT uses **MFTECmd.exe** from John Zimmerman to process MFT files. The tool extracts relevant file system metadata, which is then filtered and displayed using the WebMFT interface.  

When you upload an MFT file:  
1. **MFTECmd.exe processes the file** and extracts its records.  
2. **WebMFT applies the selected filters** (size, date, extension, etc.).  
3. **A CSV file is generated**, containing the refined data.  

---

## 💡 **Contribute**  

This project is **open-source**! Feel free to:  
- 🛠 **Fork** and improve the project.  
- 🎨 **Enhance the UI** with new styles.  
- 🌎 **Add multi-language support**.  
- 📂 **Expand filtering options**.  

---

## 📜 **License**  

This project is licensed under **MIT**, meaning you are free to use, modify, and distribute it.  

---

👨‍💻 **Enjoy processing and analyzing MFT files with WebMFT!** 🚀  