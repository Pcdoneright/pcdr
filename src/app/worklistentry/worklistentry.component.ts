import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Ng2OrderPipe } from 'ng2-order-pipe';
// import { Ng2OrderModule } from 'ng2-order-pipe';
import { DataService } from '../services/data.service';
import { DataEntryService, DataStore } from '../services/dataentry.service';
import { CompanyService } from '../services/company.service';
import { w2uiHelperService } from '../services/w2uiHelper.service';
import { wjHelperService } from '../services/wjHelper.service';
import { PcdrFilterPipe } from '../pipes/pcdrfilter.pipe';
import {LogEntry} from '../lists/logentry.component';
import {ListSODetails} from '../lists/list-sodetails.component';
import { WjFlexGrid } from 'wijmo/wijmo.angular2.grid';
import * as wjGrid from "wijmo/wijmo.grid";

@Component({
    selector: 'worklist-entry',
    templateUrl: './worklistentry.component.html',
    providers: [DataEntryService],
})

export class WorklistEntryComponent implements OnDestroy, AfterViewInit {
    @ViewChild('wlesp01') sp01;
    @ViewChild('wlmgrid01') wlmgrid01: WjFlexGrid;
    @ViewChild('wlmgrid02') wlmgrid02: WjFlexGrid;
    wH: number;
    gH01: number;
    gH02: number;
    //listWorkGrid: any;
    salesdetails: DataStore;
    //solgGrid: any;
    lfstatus:any[];
    completedOnly: boolean = false;
    notesDisplay = {};
    prevResize = 0; // Fix a but with horizontal-split-pane

    constructor(private dialog: MatDialog, private CompanySvc: CompanyService, private dESrvc: DataEntryService, private DataSvc: DataService, private w2uiH: w2uiHelperService, private datePipe: DatePipe, private $filter: PcdrFilterPipe, private OrderByPipe: Ng2OrderPipe, private wjH: wjHelperService) { }

    ngAfterViewInit() {
        // Hack Initial Size
        this.sp01.primaryComponent.nativeElement.style.height = '70%';
        this.sp01.secondaryComponent.nativeElement.style.height = '30%';

        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start
        this.initGrids();

        this.salesdetails = this.dESrvc.newDataStore('sales_order_details', ['fsoid', 'fsdid'], true, []);

        this.refresh();

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.lfstatus = this.$filter.transform(dataResponse, {fgroupid: 'SDS'}, true);
            this.lfstatus = this.OrderByPipe.transform(this.lfstatus, 'fdescription');
            this.lfstatus.unshift({fid: null, fdescription: ''}); // Add Null Item
            // this.w2uiH.arrayToSelect(this.lfstatus, 'fid', 'fdescription'); // add id & text
            // this.listWorkGrid.columns[4].editable.items = this.lfstatus;
            this.wlmgrid01.columns[4].dataMap = new wjGrid.DataMap(this.lfstatus, 'fid', 'fdescription');

            // this.w2uiH.gridInit(this.listWorkGrid); // Set Default Values & Prepare
            // this.w2uiH.gridInit(this.solgGrid); // Set Default Values & Prepare
            // this.refresh();
            this.onResize(null); // Refresh Grids
        });

        $(document).ready(() => {
            
        });
    }

    ngOnDestroy() {
        // this.w2uiH.gridDestroy(this.listWorkGrid);
        // this.w2uiH.gridDestroy(this.solgGrid);
    }

    refresh() {
        this.CompanySvc.ofHourGlass(true);
        // this.w2uiH.gridLoad(this.solgGrid, []); // Clear Rows
        this.wjH.gridLoad(this.wlmgrid02, []); // Clear Rows

        this.DataSvc.serverDataGet('api/SO/GetWorkList', {pCompleted: this.completedOnly}).subscribe((dataResponse) => {
            this.salesdetails.loadData(dataResponse);
            this.wjH.gridLoad(this.wlmgrid01, this.salesdetails.items);
            // this.w2uiH.gridLoad(this.listWorkGrid, this.salesdetails.items);
            
            this.CompanySvc.ofHourGlass(false);
        });
    }

    refreshLog(pFsoid) {
        this.DataSvc.serverDataGet('api/SO/GetSalesLog', {pfsoid: pFsoid}).subscribe((dataResponse) => {
            // this.w2uiH.gridLoad(this.solgGrid, dataResponse); // Load filtered rows
            this.wjH.gridLoad(this.wlmgrid02, dataResponse); // Load filtered rows
            this.wlmgrid02.autoSizeRows();
        });
    }

    update() {
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/SO/PostupdateWorkList').finally(() => {
            this.CompanySvc.ofHourGlass(false);
            setTimeout(()=> this.refresh(), 0);
        }).subscribe();
    }

    logAdd() {
        // let row = this.w2uiH.getGridSelectecRow(this.listWorkGrid);
        let row = this.wjH.getGridSelectecRow(this.wlmgrid01);
        if (!row) return;

        let dialogRef: MatDialogRef<LogEntry>;
        dialogRef = this.dialog.open(LogEntry);
        dialogRef.componentInstance.fsoid = row.fsoid;
        dialogRef.componentInstance.fCodetable = this.dESrvc.codeTable;
        dialogRef.afterClosed().subscribe((retValue)=> {
            if (retValue) this.refreshLog(row.fsoid);
        });
    }

    viewDetails() {
        // let row = this.w2uiH.getGridSelectecRow(this.listWorkGrid);
        let row = this.wjH.getGridSelectecRow(this.wlmgrid01);
        if (!row) return;

        let dialogRef: MatDialogRef<ListSODetails>;
        dialogRef = this.dialog.open(ListSODetails);
        dialogRef.componentInstance.fsoid = row.fsoid;
        dialogRef.componentInstance.fticket = row.fticket;
        dialogRef.afterClosed();
    }

    // Fix to only do it on-ended-resizing
    onSPChange(event) {
        setTimeout(() => this.onResize(null), 0);
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.wH = window.innerHeight - 50;
            this.gH01 = this.sp01.getPrimarySize() - 105;
            this.gH02 = this.sp01.getSecondarySize() - 55;

            // Prevent removing focus from worklist since everytime it focus it triggers horizontal-split-pane resize event
            if (this.prevResize !== this.gH01) {
                this.prevResize = this.gH01;

                // this.w2uiH.gridResize(this.listWorkGrid);
                // this.w2uiH.gridResize(this.solgGrid);
            }
        }, 100);
    };

    initGrids() {
        // wjflexgrid
        this.wlmgrid01.initialize({
            frozenColumns: 1,
            //itemsSource: this.salesdetails.items,
            // beginningEdit: (s, e) => {
            //     var col = s.columns[e.col];
            //     if (col.binding == 'fitemid') {
            //         var rec = s.rows[e.row].dataItem;
            //         if (!this.item.isNew(rec)) e.cancel = true; // Modify new only
            //     }
            // },
            // cellEditEnding: (s, e) => {
            //     var col = s.columns[e.col];
            //     var rec = s.rows[e.row].dataItem;
            //     if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

            //     switch (col.binding) {
            //         case 'fitemid':
            //             s.activeEditor.value = s.activeEditor.value.toUpperCase();
            //             break
            //         case 'fdescription':
            //             if (s.activeEditor.value) {
            //                 if (!rec.finternal) rec.finternal = s.activeEditor.value; // Copy to finternal
            //             }
            //             break
            //     }
            // },
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.wlmgrid01, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.wlmgrid01);
                    if (!row) return;
                    this.refreshLog(row.fsoid);
                    this.notesDisplay = row; // Assign pointer to display note values
                }
            },
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'fequipment':
                            e.cell.textContent = row.fbrand + " " + ((row.fmodel)? row.fmodel:"");
                            break;
                        case 'fphone':
                            var row = s.rows[e.row].dataItem;
                            e.cell.textContent = this.CompanySvc.phoneRenderer({value: row.fphone});
                            break;
                    }
                }
            },
            columns: [
                { binding: "fticket", header: "Ticket", width: 70, isReadOnly: true, format: 'D' },
                { binding: "fdate", header: "Date", width: 100, isReadOnly: true, format:'MM/dd/yyyy' },
                { binding: 'fbackup', header: 'Backup', width: 80 },
                { binding: 'fvnc', header: 'VNC', width: 70 },
                { binding: "fstatus", header: "Status", width: 150},
                { binding: "fpassword", header: "Password", width: 150},
                { binding: 'fequipment', header: 'Equipment', width: 250, isReadOnly: true},
                { binding: "cfpctype", header: "Type", width: 80, isReadOnly: true },
                { binding: "fname", header: "Customer", width: 180, isReadOnly: true },
                { binding: "fphone", header: "Phone", width: 130, isReadOnly: true}
            ]
        });
        this.wjH.gridInit(this.wlmgrid01, true);

        // wjflexgrid
        this.wlmgrid02.initialize({
            isReadOnly: true,
            // formatItem: (s, e) => {
            //     if (e.panel == s.cells) {
            //         var col = s.columns[e.col], row = s.rows[e.row].dataItem;
            //         switch (col.binding) {
            //             case 'fequipment':
            //                 e.cell.textContent = row.fbrand + " " + ((row.fmodel)? row.fmodel:"");
            //                 break;
            //             case 'fphone':
            //                 var row = s.rows[e.row].dataItem;
            //                 e.cell.textContent = this.CompanySvc.phoneRenderer({value: row.fphone});
            //                 break;
            //         }
            //     }
            // },
            columns: [
                { binding: "fdate", header: "Date", width: 170, format:'MM/dd/yyyy h:mm tt' },
                { binding: 'fby', header: 'By', width: 100 },
                { binding: 'cfaction', header: 'Action', width: 180 },
                { binding: "fnotes", header: "Notes", width: "*", wordWrap: true}
            ]
        });
        this.wjH.gridInit(this.wlmgrid02, true);

        // w2ui
        // this.listWorkGrid = {
        //     name: 'wlmgrid01',
        //     // sortable: false,
        //     singleClickEdit: true,
        //     onSelect: (event) => {
        //         if (this.w2uiH.gridSelectChanged(this.listWorkGrid, event.recid)) {
        //             var row = this.listWorkGrid.api.get(event.recid);
        //             this.refreshLog(row.fsoid);
        //             this.notesDisplay = row; // Assign pointer to display note values
        //         }
        //     },
        //     onChange: (event) => {
        //         var rec = this.listWorkGrid.api.get(event.recid); // Get row
        //         switch (event.column) {
        //             case 4:
        //                 rec.fstatus = event.value_new;
        //                 rec.cfstatus = this.$filter.transform(this.lfstatus, {fid: rec.fstatus}, true)[0].fdescription;
        //                 if (rec.fstatus == 'F') {rec.ffinishdate = new Date()} // update finish date for 'F'inish
        //                 break;
        //         }
        //         this.w2uiH.onChangeComplete(event); // Always include
        //     },
        //     columns: [
        //         {field: "fticket", caption: "Ticket", size: 70},
        //         {field: "fdate", caption: "Date", size: 100, render: (record) => {return this.CompanySvc.dateRenderer({value: record.fdate});}},
        //         {field: "fbackup", caption: "Backup", size: 80, editable: {type: 'text'}},
        //         {field: "fvnc", caption: "VNC", size: 70, editable: {type: 'text'}},
        //         {field: "fstatus", caption: "Status", size: 150, editable: {type: 'select'}, render: (record) => {return record.cfstatus;}},
        //         {field: "fpassword", caption: "Password", size: 150, editable: {type: 'text'}},
        //         {field: "fequipment", caption: "Equipment", size: 250, render: (record) => {return record.fbrand + " " + ((record.fmodel)? record.fmodel:"");}},
        //         {field: "cfpctype", caption: "Type", size: 100},
        //         {field: "fname", caption: "Customer", size: 180},
        //         {field: "fphone", caption: "Phone", size: 130, render: (record) => {return this.CompanySvc.phoneRenderer({value: record.fphone});}}
        //     ]
        // };

        // w2ui
        // this.solgGrid = {
        //     name: 'wlmgrid02',
        //     sortable: false,
        //     columns: [
        //         { field: "fdate", caption: "On", size: 170, render: (record) => {
        //             // Replacing T with empty allows to display accurate datetime
        //             // return this.datePipe.transform(record.fdate.replace('T', ' '), 'MM/dd/yyyy h:mm a');
        //             return this.datePipe.transform(record.fdate, 'MM/dd/yyyy h:mm a');
        //         }},
        //         { field: "fby", caption: "By", size: 100},
        //         { field: "cfaction", caption: "Action", size: 180},
        //         { field: "fnotes", caption: "Notes", size: 750}
        //     ]
        // };
    }
}