import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ToastrService } from 'toastr-ng2';
import { DataService } from '../services/data.service';
import { SharedService } from '../services/shared.service';
import { DataEntryService, DataStore } from '../services/dataentry.service';
import { CompanyService } from '../services/company.service';
import { w2uiHelperService } from '../services/w2uiHelper.service';
import { wjHelperService } from '../services/wjHelper.service';
import { PcdrFilterPipe} from '../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from 'wijmo/wijmo.angular2.grid';
import * as wjGrid from "wijmo/wijmo.grid";

@Component({
    selector: 'app-itemmaint',
    templateUrl: './itemmaint.component.html',
    providers: [DataEntryService]
})
export class ItemMaintComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('img01') img01:WjFlexGrid;
    gHeight: number;
    itemGrid: any;
    item: DataStore;
    categories: any[];

    actions = 'Prog,Soft,Other'.split(',');

    constructor(private toastr: ToastrService, private $filter: PcdrFilterPipe, private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, private w2uiH: w2uiHelperService, private wjH: wjHelperService) {}

    ngOnInit() {
        // Data Stores, Unique Keys, updatable, yvalidate fields
        this.item = this.dESrvc.newDataStore('items', ['fitemid'], true, ['fdescription', 'finternal', 'fprice']);
        this.dESrvc.validateDataStore('items', 'ITEMS', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('items', 'ITEMS', 'finternal', 'INTERNAL');
        this.dESrvc.validateDataStore('items', 'ITEMS', 'fprice', 'PRICE');

        this.initGrids();
        this.dESrvc.initCodeTable().subscribe(dataResponse => {
            this.categories = this.$filter.transform(dataResponse, {fgroupid: 'IC'}, true);
            // this.w2uiH.arrayToSelect(this.categories, 'fid', 'fdescription');
            // this.itemGrid.columns[5].editable = { type: 'select', items: this.categories };
        });
    }

    ngAfterViewInit(){
        window.onresize = (e) => {this.onResize(e)} // Capture resize event
        this.onResize(null); // Execute at start

        // Allow JQuery to recognize DOM
        $(document).ready(()=> {
            this.DataSvc.serverDataGet('api/ItemMaint/GetItems').subscribe((data) => {
                // this.w2uiH.gridInit(this.itemGrid); // Set Default Values & Prepare
                this.item.loadData(data);
                this.wjH.gridLoad(this.img01, this.item.items);
                // this.w2uiH.gridLoad(this.itemGrid, this.item.items);
                
                // this.initGrids2();
                this.img01.columns[5].dataMap = new wjGrid.DataMap(this.categories, 'fid', 'fdescription');
            });
        });
    }

    ngOnDestroy() {
        // this.w2uiH.gridDestroy(this.itemGrid);
    }

    update() {
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/ItemMaint/Postupdate', true, '', this.fprepareUpdate).finally(() => {
            this.CompanySvc.ofHourGlass(false);
        }).subscribe();
    }

    // Prepare postdata
    fprepareUpdate(mData) {
        // For each insert/update/delete
        for (var i = 0; i < mData.length; i++) {
            // always sencond field(1) is array
            for (var j = 0; j < mData[i][1].length; j++) {
                if (mData[i][1][j].ftaxable === true) {
                    mData[i][1][j].ftaxable = 1;
                }
                else if (mData[i][1][j].ftaxable === false) {
                    mData[i][1][j].ftaxable = 0;
                }
            }
        }
    }

    itemAdd() {
        this.CompanySvc.inputDialog('Item ID').subscribe((value) => {
			if (value) {
				this.item.addRow({
					fprice: 0,
                    ftaxable: 1,
					fitemid: value
				});
				this.wjH.gridLoad(this.img01, this.item.items);
                this.wjH.gridScrollToLastRow(this.img01, 1);
			}
		});
        // this.w2uiH.gridLoad(this.itemGrid, this.item.items, false); // Load Data, no refresh
        // this.w2uiH.gridScrollToLastRow(this.itemGrid, 0, true); // Focus
    }

    itemRemove() {
        // this.w2uiH.removeGridRow(this.itemGrid, this.item).subscribe(); // must subscribe
        this.wjH.removeGridRow(this.img01, this.item).subscribe(); // must subscribe
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.gHeight = window.innerHeight - 105;
            // this.w2uiH.gridResize(this.itemGrid);
        }, 100);
    };

    initGrids2() {
    };

    initGrids() {
        this.img01.initialize({
            itemsSource: this.item.items,
            // gotFocus: function(s, e) {
            //     s.startEditing(false); // quick mode
            // },
            // selectionChanged: function(s, e) {
            //     setTimeout(function() {
            //       s.startEditing(false); // quick mode
            //   }, 50); // let the grid update first
            // },
            // beginningEdit: (s, e) => {
            //     var col = s.columns[e.col];
            //     if (col.binding == 'fitemid') {
            //         var rec = s.rows[e.row].dataItem;
            //         if (!this.item.isNew(rec)) e.cancel = true; // Modify new only
            //     }
            // },
            cellEditEnding: (s, e) => {
                var col = s.columns[e.col];
                var rec = s.rows[e.row].dataItem;
                if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

                switch (col.binding) {
                    case 'fitemid':
                        s.activeEditor.value = s.activeEditor.value.toUpperCase();
                        break
                    case 'fdescription':
                        if (s.activeEditor.value) {
                            if (!rec.finternal) rec.finternal = s.activeEditor.value; // Copy to finternal
                        }
                        break
                }
            },
            columns: [
                { binding: "fitemid", header: "ID", width: 90, isReadOnly: true },
                { binding: 'fdescription', header: 'Description', width: '*' },
                { binding: 'finternal', header: 'Internal', width: '*' },
                { binding: "fprice", header: "Price", width: 80, format: 'c'},
                { binding: "ftaxable", header: "Taxable", width: 70, dataType: 'Boolean' },
                { binding: "fcategory", header: "Category", width: 150}
            ]
        });
        this.wjH.gridInit(this.img01);

        //w2ui
        // this.itemGrid = {
        //     name: 'imgrid01',
        //     sortable: false,
        //     singleClickEdit: true,
        //     onEditField: (event) => {
        //     	switch (event.column) {
        //     		case 0: // fitemid
        //     			var rec = this.w2uiH.getGridRow(event);
        //     			if (rec.fitemid)
        //     				if (!this.item.isNew(rec)) event.preventDefault(); // Modify new only
        //     			break;
        //     	}
        //     },
        //     onChange: (event) => {
        //         var rec = this.w2uiH.getGridRow(event);
        //         switch (event.column) {
        //             case 0: // fitemid
        //     			if (event.value_new) event.value_new = event.value_new.toUpperCase(); // Convert to Ucase
        //                 break;
        //             case 1: // fdescription
        //     			if (event.value_new) {
        //                     if (!rec.finternal) rec.finternal = event.value_new; // Copy to finternal
        //                 }
        //                 break;
        //         }

        //         this.w2uiH.onChangeComplete(event); // Always include
        //     },
        //     columns: [
        //         {field: "fitemid", caption: "ID", size: 80, style: 'text-transform: uppercase', editable: { type: 'text' }},
        //         {field: "fdescription", caption: "Description", size: 250, editable: { type: 'text' }},
        //         {field: "finternal", caption: "Internal", size: 250, editable: { type: 'text' }},
        //         {field: "fprice", caption: "Price", size: 80, editable: {type: 'money'}, render: 'money'},
        //         {field: "ftaxable", caption: "Taxable", size: 70, editable: { type: 'checkbox' }},
        //         {field: "fcategory", caption: "Category", size: 150, render: (record, index, col_index) => {
        //             for (var p in this.categories) {
        //                 if (this.categories[p].id == this.itemGrid.api.getCellValue(index, col_index)) {return this.categories[p].text;}
        //             }
        //             return '';
        //         }},
        //     ]
        // };
    }
}