// src/utils/dataImportExport.js
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
// Function to convert data to CSV format
export const convertToCSV = (objArray) => {
    if (!objArray || !objArray.length) {
      return '';
    }
    
    const columns = Object.keys(objArray[0]);
    
    // Create header row
    let csv = columns.join(',') + '\n';
    
    // Add data rows
    objArray.forEach(item => {
      const row = columns.map(column => {
        // Handle values that might contain commas or quotes
        let value = item[column] !== undefined ? item[column] : '';
        
        // Convert all values to string
        const stringValue = String(value);
        
        // Escape quotes and commas
        if (stringValue.includes('"') || stringValue.includes(',')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      
      csv += row.join(',') + '\n';
    });
    
    return csv;
  };
  
  // Function to export data as CSV file
  export const exportAsCSV = (data, filename = 'export.csv') => {
    if (!data || !data.length) {
      console.error('No data to export');
      return;
    }
    
    const csv = convertToCSV(data);
    
    // Create a blob with CSV content
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Add link to document
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Function to convert data to Excel format (requires sheetjs library)
  export const exportAsExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
    if (!data || !data.length) {
      console.error('No data to export');
      return;
    }
    
    try {
      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Create a workbook with the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Generate Excel file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };
  
  // Function to export data as PDF (using html2pdf or similar library)
  export const exportAsPDF = (data, title, filename = 'export.pdf') => {
    if (!data || !data.length) {
      console.error('No data to export');
      return;
    }
    
    // Create a temporary div to hold the table
    const element = document.createElement('div');
    element.style.display = 'none';
    
    // Create a title
    const titleElement = document.createElement('h2');
    titleElement.textContent = title || 'Exported Data';
    element.appendChild(titleElement);
    
    // Create a table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Add header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const columns = Object.keys(data[0]);
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      th.style.border = '1px solid #ddd';
      th.style.padding = '8px';
      th.style.backgroundColor = '#f2f2f2';
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Add data rows
    const tbody = document.createElement('tbody');
    
    data.forEach(item => {
      const row = document.createElement('tr');
      
      columns.forEach(col => {
        const td = document.createElement('td');
        td.textContent = item[col] !== undefined ? item[col] : '';
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        row.appendChild(td);
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    element.appendChild(table);
    
    // Add the element to the document
    document.body.appendChild(element);
    
    // Use html2pdf to generate PDF (requires the library to be loaded)
    // This is a placeholder - in a real app, you would use an actual PDF generation library
    alert('In a real implementation, this would generate a PDF');
    
    // Clean up
    document.body.removeChild(element);
  };
  
  // Function to parse CSV data
  export const parseCSV = (csvData) => {
    return new Promise((resolve, reject) => {
      try {
        // Use PapaParse to parse CSV
        Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: (error) => {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // Function to handle file import
  export const importFromFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const fileExtension = file.name.split('.').pop().toLowerCase();
          
          if (fileExtension === 'csv') {
            // Parse CSV file
            const parsedData = await parseCSV(event.target.result);
            resolve(parsedData);
          } else if (['xls', 'xlsx'].includes(fileExtension)) {
            // Parse Excel file
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first sheet
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } else {
            reject(new Error('Unsupported file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      if (['xls', 'xlsx'].includes(file.name.split('.').pop().toLowerCase())) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };
  
  // Export document as plain text
  export const exportAsText = (data, filename = 'export.txt') => {
    if (!data) {
      console.error('No data to export');
      return;
    }
    
    // Convert data to string
    let textContent = '';
    
    if (Array.isArray(data)) {
      // Handle array of objects
      data.forEach((item, index) => {
        textContent += `Record ${index + 1}:\n`;
        Object.entries(item).forEach(([key, value]) => {
          textContent += `${key}: ${value}\n`;
        });
        textContent += '\n';
      });
    } else if (typeof data === 'object' && data !== null) {
      // Handle single object
      Object.entries(data).forEach(([key, value]) => {
        textContent += `${key}: ${value}\n`;
      });
    } else {
      // Handle string or other primitive
      textContent = String(data);
    }
    
    // Create a blob with text content
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Add link to document
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };