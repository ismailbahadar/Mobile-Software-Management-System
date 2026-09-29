export class ExportService {
  public static exportToCSV(filename: string, rows: Array<Record<string, any>>) {
    if (!rows || !rows.length) {
      alert('No data available to export');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(fieldName => {
          let value = row[fieldName] ?? '';
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }).join(',')
      )
    ].join('\r\n');

    // Add UTF-8 BOM so Excel opens with proper Urdu / special character support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static printDocument() {
    window.print();
  }
}
