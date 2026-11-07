import React from 'react';
import {AgGridReact} from 'ag-grid-react';
import {AllCommunityModule, ModuleRegistry, themeQuartz} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Scoped to the ScopePay ember palette so the grid reads as part of the product,
// not a dropped-in widget.
const scopeTheme = themeQuartz.withParams({
  backgroundColor: 'rgba(27,21,17,0.55)',
  foregroundColor: '#f4ede4',
  headerBackgroundColor: 'rgba(20,15,12,0.6)',
  headerTextColor: '#d9cfc2',
  borderColor: 'rgba(255,255,255,0.10)',
  rowHoverColor: 'rgba(255,255,255,0.06)',
  selectedRowBackgroundColor: 'rgba(255,106,47,0.16)',
  accentColor: '#ff6a2f',
  fontFamily: {googleFont: 'Inter Variable'},
  headerFontFamily: {googleFont: 'Inter Variable'},
  borderRadius: 14,
  wrapperBorder: false,
  rowHeight: 44,
  headerHeight: 40,
});

export default function ScopeGrid({rowData, columnDefs, onRowClicked, height = 340}) {
  return (
    <div style={{height, width: '100%'}}>
      <AgGridReact
        theme={scopeTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        onRowClicked={onRowClicked}
        rowSelection="single"
        suppressCellFocus
        animateRows
        defaultColDef={{sortable: true, filter: true, resizable: true, flex: 1, minWidth: 110}}
      />
    </div>
  );
}
