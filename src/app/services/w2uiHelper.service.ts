import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class w2uiHelperService {

    constructor() {}

    // Default Global Settings
    gridInit(pGrid) {
        //if (!pGrid.onInitialized) pGrid.onInitialized = (e) => { pGrid.gridApi = e.component; }; // Save object pointer

        if (!pGrid.hasOwnProperty('recordHeight')) { pGrid.recordHeight = 34 }
        if (!pGrid.hasOwnProperty('multiSelect')) { pGrid.multiSelect = false }
        if (!pGrid.hasOwnProperty('reorderColumns')) { pGrid.reorderColumns = false } // By default no moving columns
        if (!pGrid.hasOwnProperty('sortable')) { pGrid.sortable = true }
        if (pGrid.hasOwnProperty('singleClickEdit')) {
            if (!pGrid.hasOwnProperty('onClick')) {
                pGrid.onClick = (event) => {
                    // if (event.column == NaN) return; // Valid Column Only
                    // For non-combobox
                    if (pGrid.columns[event.column].hasOwnProperty('editable') && !pGrid.columns[event.column].editable.hasOwnProperty('items')) {
                        setTimeout(() => {
                            pGrid.api.editField(event.recid, event.column)
                        })
                    }
                };
            }
        }
        // Allow to apply changes after edit
        if (!pGrid.hasOwnProperty('onChange')) {
            pGrid.onChange = (event) => {
                this.onChangeComplete(event); // Always include
            }
        }

        // For each Column set properties
        var len = pGrid.columns.length;
        for (var i = 0; i < len; i++) {
            if (!pGrid.columns[i].hasOwnProperty('resizable')) { pGrid.columns[i].resizable = true } // resizable
            if (!pGrid.columns[i].hasOwnProperty('sortable')) { pGrid.columns[i].sortable = pGrid.sortable } // sortable
            if (!pGrid.columns[i].hasOwnProperty('min')) { pGrid.columns[i].min = pGrid.columns[i].size } // width
        }

        // rowData v4 not reliable anymore
        pGrid.rowCount = function () {
            return (pGrid.hasOwnProperty('api')) ? pGrid.api.records.length : 0;
        };

        // Register but check if exist first
        if (w2ui.hasOwnProperty(pGrid.name)) { w2ui[pGrid.name].destroy(); }
        //$('#' + pGrid.name).w2grid(pGrid); // TS reports error
        $('#' + pGrid.name)['w2grid'](pGrid);
        pGrid.api = w2ui[pGrid.name];
    }

    gridDestroy(pGrid) {
        if (w2ui.hasOwnProperty(pGrid.name)) { w2ui[pGrid.name].destroy(); }
    }

    gridLoad(pGrid, pData, pRefresh = true) {
        pGrid.prevRecid = ''; // Clear Value that holds last current recid (string)
        // Add recid
        var arrayLength = pData.length;
        for (var i = 0; i < arrayLength; i++) {
            // if (pData.hasOwnProperty('recid')) {break;}
            pData[i].recid = i + 1;
        }
        pGrid.api.clear(); // Remove all rows
        pGrid.api.add(pData); // Add to Table
        if (pRefresh) setTimeout(() => pGrid.api.refresh(), 0); // Since inside Init
    }

    gridResize(pGrid) {
        // setTimeout(() => { if (pGrid.hasOwnProperty('api')) pGrid.api.resize() }, 100);
        setTimeout(() => { if (pGrid.hasOwnProperty('api')) pGrid.api.refresh() }, 0);
    }

    // Test if current row has changed
    gridSelectChanged(pGrid, pRecid) {
        if (pGrid.prevRecid !== pRecid) {
            pGrid.prevRecid = pRecid;
            return true;
        }
        return false;
    }

    // Scroll to last row and focus on specific column
    gridScrollToLastRow(pGrid: any, col: number, pEdit = true) {
        var row = pGrid.api.records.length;
        if (row == 0) return;

        setTimeout(()=> {
            if (!pEdit) {
                pGrid.api.select(pGrid.api.records[row - 1].recid);
                pGrid.api.scrollIntoView(); // Last selected
            }
            else {
                pGrid.api.scrollIntoView(row - 1);
                pGrid.api.editField(pGrid.api.records[row - 1].recid, col);
            }
        }, 0);
    }

    // Scroll to a row and column and select it unless 'nofucus = true'
    gridScrollToRow(pGrid: any, col: number, row: any, noEdit = false) {
        if (pGrid.api.records.length == 0) return; // No rows return

        setTimeout(()=> {
            if (noEdit) pGrid.api.select(row.recid);
            else pGrid.api.editField(row.recid, col);
        }, 0);
    }

    // Add id & text properties for SELECT to work
    arrayToSelect(pArray: any[], pid: string, pText: string) {
        for (var i = 0; i < pArray.length; i++) {
            var obj = pArray[i];
            obj.id = obj[pid];
            obj.text = obj[pText];
        }
    }


    removeGridRow(grid, store, newOnly = false, loadrows = true) {
        var row = grid.api.get(grid.api.getSelection()[0]);
        if (!row) return; // No selected row

        if (newOnly && store.isNew(row) || newOnly == false) {
            return Observable.create(observer => {
                store.removeRow(row).subscribe(() => {
                    if (loadrows) this.gridLoad(grid, store.items); // Load Data
                    observer.next();
                });
            });
        }
        // if (newOnly)  {
        //     if (store.isNew(row)) {
        //         return Observable.create(observer => {
        //             store.removeRow(row).subscribe(() => {
        //                 if (loadrows) this.gridLoad(grid, store.items); // Load Data
        //                 observer.next();
        //             });
        //         });
        //     }
        // }
        // else {
        //     return Observable.create(observer => {
        //         store.removeRow(row).subscribe(() => {
        //             if (loadrows) this.gridLoad(grid, store.items); // Load Data only if requested, could be filtered
        //             observer.next();
        //         });
        //     })
        // }
    }

    getGridSelectecRow(grid) {
        return grid.api.get(grid.api.getSelection()[0]);
    }

    getGrid(pName) {
        return w2ui[pName];
    }

    onChangeComplete(event) {
        if (event.value_original == null && event.value_new == '') event.value_new = null; // Prevent blank when null
        event.onComplete = () => { this.getGrid(event.target).mergeChanges() }; // Apply Changes
    }

    getGridRow(event) {
        return this.getGrid(event.target).get(event.recid); // Get row
    }

    // Redraw Grid if it wasn't rendered due to ng2
    redrawGrid(grid) {
        if ($('#' + grid.name).children().length == 0) {
            w2ui[grid.name].render($('#' + grid.name)[0]);
            grid.api.refresh();
        }
        else {
            setTimeout(()=> grid.api.refresh(), 100);
        }
    }
}
