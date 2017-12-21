import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class agGridHelperService {

    constructor() {}

    // Default Global Settings
    gridInit(pGrid) {
        if (!pGrid.hasOwnProperty('getRowHeight')) pGrid.rowHeight = 34;
        pGrid.headerHeight = 34;
        pGrid.rowData = []; // Prevents showing 'Loading...'
        pGrid.enableColResize = true;
        pGrid.rowSelection = 'single';
        // Hide Enterprise features for filter
        pGrid.suppressContextMenu = true;
        pGrid.suppressMenuMainPanel = true;
        pGrid.suppressMenuColumnPanel = true;

        if (!pGrid.hasOwnProperty('enableSorting')) pGrid.enableSorting = true;
        if (!pGrid.hasOwnProperty('onCellFocused')) pGrid.onCellFocused = function(params) {
            if (params.rowIndex != null) pGrid.api.selectIndex(params.rowIndex);
        };

        // rowData v4 not reliable anymore
        pGrid.rowCount = function () {
            // return (pGrid.hasOwnProperty('api')) ? pGrid.api.getModel().rowsAfterFilter.length : 0;
            return (pGrid.hasOwnProperty('api')) ? pGrid.api.getModel().getRowCount() : 0;
        };

        // For each Column Set Properties
        for (var i = 0; i < pGrid.columnDefs.length; i++) {
            if (!pGrid.hasOwnProperty('enableFilter')) pGrid.columnDefs[i].suppressMenu = true; // if not assign
        }

        // Override Function Bug //TODO: Check with new version
        // this.$timeout(()=> {
        //     var to = this.$timeout;
        //     pGrid.api.setFocusedCell = function (rowIndex:any, colIndex:any) {
        //         var renderedRow = this.rowRenderer.renderedRows[rowIndex];
        //         var column = this.rowRenderer.columnModel.getAllDisplayedColumns()[colIndex];
        //         if (renderedRow && column) {
        //             var eCell = renderedRow.getCellForCol(column);
        //             this.rowRenderer.focusCell(eCell, rowIndex, colIndex, column.getColDef(), true);
        //             to(()=> {eCell.click()}, 50); // Enable Editing
        //         }
        //     };
        // }, 100);
    }

    getRowData(pGrid) {
        // var rowData = [];
        // pGrid.api.forEachNode( function(node) {
        //     rowData.push(node.data);
        // });
        // return rowData;
        return pGrid.api.getModel().rowsToDisplay;
    }
}