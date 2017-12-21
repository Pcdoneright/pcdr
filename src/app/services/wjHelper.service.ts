import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { WjFlexGrid } from 'wijmo/wijmo.angular2.grid';
import * as wjGrid from "wijmo/wijmo.grid";
import { DataStore } from './dataentry.service';

@Injectable()
export class wjHelperService {

    // Enables Tab Key to change fields
    onGridKeyPress(s: WjFlexGrid, e: any) {
        if (s.rows.length == 0) return false; // No rows
        const n = (window.event) ? e.which : e.keyCode;
        if (n === 9) {
            if (e.shiftKey) { // Shift+Tab
                if (s.selection.col === 0) { // First Column
                    if (s.selection.row === 0) { // First Row, do nothing
                        return true;
                    }
                    // Previous row, last column
                    s.select(new wjGrid.CellRange(s.selection.row - 1, s.columns.length - 1));
                } else {
                    s.select(new wjGrid.CellRange(s.selection.row, s.selection.col - 1));
                }
                return false;
            }
            if (s.selection.col === s.columns.length - 1) {
                if (s.selection.row === s.rows.length - 1) {
                    return true;
                }
                let i = 0;
                while (s.columns[i].isReadOnly) {
                    i++;
                }
                s.select(new wjGrid.CellRange(s.selection.row + 1, i));
            } else {
                let i = s.selection.col + 1;
                while (s.columns[i].hasOwnProperty('isReadOnly') && s.columns[i].isReadOnly) {
                    i++;
                }
                s.select(new wjGrid.CellRange(s.selection.row, i));
            }
            return false;
        }
    }

    // Used for editing grids
    onGridGotFocus = (s: WjFlexGrid, e) => {
        s.startEditing(false); // quick mode
    }
    // Used for editing grids
    onGridSelectionChanged(s, e) {
        setTimeout(function () {
            s.startEditing(false); // quick mode
        }, 50); // let the grid update first
    };

    gridInit(s, pallowSorting = false) {
        s.autoGenerateColumns = false;
        s.selectionMode = wjGrid.SelectionMode.Row;
        s.allowSorting = pallowSorting;
        s.headersVisibility = 1;
    }

    gridLoad(s: WjFlexGrid, dataSource) {
        s['mPrevRow'] = null; // Clear custom property
        s.itemsSource = []; // Clear source
        s.itemsSource = dataSource; // Reasign
        s.select(new wjGrid.CellRange(-1)); // Don't display initial selection
    }

    gridScrollToLastRow(s: WjFlexGrid, column: number = 0) {
        s.select(new wjGrid.CellRange(s.rows.length - 1, column));
    }

    gridScrollToRow(s: WjFlexGrid, col:number, row:number) {
        s.select(new wjGrid.CellRange(row, col));
    }

    removeGridRow(s: WjFlexGrid, store: DataStore, newOnly = false, loadrows = true) {
        var row = s.rows[s.selection.row].dataItem;
        if (!row) return; // No selected row

        if (newOnly && store.isNew(row) || newOnly == false) {
            return Observable.create(observer => {
                store.removeRow(row).subscribe(() => {
                    if (loadrows) this.gridLoad(s, store.items); // Load Data
                    observer.next();
                });
            });
        }
    }

    rowCount(s: WjFlexGrid) {
        return s.rows.length;
    }

    getGridSelectecRow(s: WjFlexGrid) {
        // return (s.rows.length == 0)? null: s.rows[s.selection.row].dataItem;
        if (s.rows.length == 0) return null;
        if (s.selection.row >= 0) {
            return s.rows[s.selection.row].dataItem;
        }
        return null;
    }

    gridSelectChanged(pGrid, row) {
        // Create new property to save prev row
        if (pGrid.mPrevRow !== row) {
            pGrid.mPrevRow = row;
            return true;
        }
        return false;
    }

    gridRedraw(s: WjFlexGrid) {
        setTimeout(() => { s.refresh(); }, 10);
    }

    // See if editing current cell
    gridEditingCell(s: WjFlexGrid, e) {
        return (s.selection.col == e.col && s.selection.row == e.row );
    }

    gridRowDblClick(e) {
        return (['wj-state-selected','wj-alt'].indexOf(e.srcElement.classList[1]) >= 0);
    }
}