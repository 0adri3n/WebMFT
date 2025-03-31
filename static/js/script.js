

function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const moonIcon = document.getElementById('moon-icon');
  const sunIcon = document.getElementById('sun-icon');

  document.documentElement.classList.add('dark');
  moonIcon.classList.add('hidden');
  sunIcon.classList.remove('hidden');

  themeToggle.addEventListener('click', function() {
    document.documentElement.classList.toggle('dark');
    moonIcon.classList.toggle('hidden');
    sunIcon.classList.toggle('hidden');
  });
}

function initTabs() {
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  const navButtons = document.querySelectorAll('.nav-button');

  function setActiveTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    tabTriggers.forEach(trigger => trigger.classList.remove('active'));
    navButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(`${tabId}-tab`).classList.add('active');
    document.querySelector(`.tab-trigger[data-tab="${tabId}"]`).classList.add('active');
    document.querySelector(`.nav-button[data-tab="${tabId}"]`).classList.add('active');
  }

  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      setActiveTab(this.dataset.tab);
    });
  });

  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      setActiveTab(this.dataset.tab);
    });
  });
}

function initForms() {
  const fileForm = document.getElementById('file-form');
  const modForm = document.getElementById('mod-form');
  const fileInput = document.getElementById('file-input');

  fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      addTerminalLine(`Selected file: ${this.files[0].name}`);
    }
  });

  fileForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const selectedFile = fileInput.files[0];
    if (!selectedFile) {
      addTerminalLine("Error: No file selected", "error");
      return;
    }

    const outputName = document.getElementById('output-name').value;
    const processingMode = document.getElementById('processing-mode').value;

    addTerminalLine(`Processing file: ${selectedFile.name}`);
    addTerminalLine(`Processing mode: ${processingMode}`);
    addTerminalLine(`Output name: ${outputName}`);
    addTerminalLine("Processing...");

    const formButton = document.getElementById("start-button");
    formButton.classList.add("hidden");

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('outputName', outputName);
    formData.append('processingMode', processingMode);

    fetch('/process', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        addTerminalLine(`Error: ${data.error}`, "error");
      } else {
        addTerminalLine("Processing completed successfully!", "success");

        const resultsContainer = document.getElementById('results-container');
        const resultsTableBody = document.getElementById('results-table-body');

        resultsContainer.classList.remove('hidden');
        resultsTableBody.innerHTML = `
          <tr>
            <td>${selectedFile.name}</td>
            <td><a href='output/${outputName}'>${outputName}</a></td>
            <td>${(selectedFile.size / 1024).toFixed(2)} Kb</td>
            <td>${processingMode}</td>
            <td><button onclick="openCsvViewer('output/${outputName}')">👁️ View</button></td>
          </tr>
        `;

        formButton.classList.remove('hidden');

      }
    })
    .catch(error => addTerminalLine(`Error: ${error.message}`, "error"));
  });

}

function addTerminalLine(text, type = "normal") {
  const terminalOutput = document.getElementById('terminal-output');
  const placeholder = terminalOutput.querySelector('.terminal-placeholder');

  if (placeholder) {
    placeholder.remove();
  }

  const timestamp = new Date().toLocaleTimeString();
  let prefix = ">";
  let className = "terminal-line";

  if (type === "error") {
    prefix = "ERR!";
    className += " terminal-error";
  } else if (type === "success") {
    prefix = "OK!";
    className += " terminal-success";
  }

  const line = document.createElement('div');
  line.className = className;
  line.textContent = `[${timestamp}] ${prefix} ${text}`;

  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function openCsvViewer(filePath) {
  window.open(`/view_csv?file=${encodeURIComponent(filePath)}`, '_blank');
}

document.getElementById('add-exclusion').addEventListener('click', function() {
  const exclusionDiv = document.createElement('div');
  exclusionDiv.classList.add('exclusion-group');

  
  const columnNameLabel = document.createElement('label');
  columnNameLabel.textContent = 'Column Name:';
  const columnNameInput = document.createElement('input');
  columnNameInput.type = 'text';
  columnNameInput.placeholder = 'Enter Column Name (e.g., ParentPath)';

  
  const valueLabel = document.createElement('label');
  valueLabel.textContent = 'Value to Exclude:';
  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'Enter Exclude Value (e.g., regex:.*\\\\ProgramData\\\\.*)';

  
  exclusionDiv.appendChild(columnNameLabel);
  exclusionDiv.appendChild(columnNameInput);
  exclusionDiv.appendChild(valueLabel);
  exclusionDiv.appendChild(valueInput);

  
  document.getElementById('exclusions-container').appendChild(exclusionDiv);
});


document.getElementById('mod-form').addEventListener('submit', function(e) {
  e.preventDefault();


  const modData = {
      modName: document.getElementById('mod-name').value,
      description: document.getElementById('mod-description').value,
      exclusions: []
  };

  addTerminalLine(`Creating mod: ${document.getElementById('mod-name').value}`);
  addTerminalLine("Compiling mod...");

  
  const exclusionGroups = document.querySelectorAll('.exclusion-group');
  exclusionGroups.forEach(group => {
      const columnName = group.querySelector('input[type="text"]').value.trim();
      const excludeValue = group.querySelectorAll('input[type="text"]')[1].value.trim();

      if (columnName && excludeValue) {
          modData.exclusions.push({ columnName, excludeValue });
      }
  });


  
  fetch('/add-mod', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(modData)
  })
  .then(response => response.json())
  .then(data => {
      
      addTerminalLine("Mod created successfully!", "success");
  })
  .catch(error => {
    addTerminalLine("Error creating mod.", "error");
  });
});



var editor = ace.edit("editor-container");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/json");


fetch('/get-mods')
    .then(response => response.json())
    .then(data => {
        editor.setValue(JSON.stringify(data, null, 4)); 
    });


document.getElementById("save-mods-file").addEventListener("click", function() {
    var jsonContent = editor.getValue();
    
    fetch('/save-mods', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ modsData: JSON.parse(jsonContent) })
    })
    .then(response => response.json())
    .then(data => {
        addTerminalLine("Mod file saved successfully!", "success");
    })
    .catch(error => {
        addTerminalLine(`Error saving mod file. ${error}`, "error");
    });
});


async function fetchLogs() {
  try {
      const response = await fetch('/get-logs');
      const logs = await response.json();
      const logsTableBody = document.getElementById('logs-table-body');
      logsTableBody.innerHTML = '';

      logs.forEach(log => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${log.source_file}</td>
              <td>${log.output_file}</td>
              <td><button onclick="openCsvViewer('output/${log.output_file}')">👁️ View</button></td>
              <td>${log.file_size} Kb</td>
              <td>${log.mode}</td>
              <td>${log.timestamp}</td>
          `;
          logsTableBody.appendChild(row);
      });
  } catch (error) {
      console.error('Error fetching logs:', error);
  }
}


document.querySelector('[data-tab="logs"]').addEventListener('click', fetchLogs);

async function loadProcessingModes() {
  try {
      const response = await fetch('/get-mods');
      const data = await response.json();

      if (data.error) {
          console.error('Error fetching processing modes:', data.error);
          return;
      }

      const selectElement = document.getElementById('processing-mode');
      selectElement.innerHTML = ''; 

      
      const modNames = Object.keys(data);

      if (modNames.length > 0) {
          modNames.forEach(mod => {
              const option = document.createElement('option');
              option.value = mod;
              const description = data[mod].Description || "No description";
              option.textContent = `${mod} (${description})`;
              selectElement.appendChild(option);
          });
      } else {
          console.error("No valid mods found in mods.json.");
      }
  } catch (error) {
      console.error('Error fetching processing modes:', error);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  lucide.createIcons();

  const randomHash = Math.random().toString(36).substring(7);
  document.getElementById('output-name').value = `MFT-${randomHash}.csv`;

  initTheme();
  initTabs();
  initForms();
  loadProcessingModes();
  fetchLogs();
});