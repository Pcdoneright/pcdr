import {Component, OnDestroy, AfterViewInit, ViewChild} from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import {ToastrService} from 'toastr-ng2';
import {Ng2OrderPipe} from 'ng2-order-pipe';
import {DataService} from '../../services/data.service';
import {DataEntryService, DataStore} from '../../services/dataentry.service';
import {CompanyService} from '../../services/company.service';
import {w2uiHelperService} from '../../services/w2uiHelper.service';
import {PcdrFilterPipe} from '../../pipes/pcdrfilter.pipe';
import {ListPrograms} from '../../lists/list-programs.component';

@Component({
    selector: 'app-programmaint',
    templateUrl: './programmaint.component.html',
    providers: [DataEntryService],
})

export class ProgMaintComponent implements OnDestroy, AfterViewInit {
    filterOrder: Ng2OrderPipe = new Ng2OrderPipe();
    $filter: PcdrFilterPipe = new PcdrFilterPipe();
    @ViewChild('prmsp01') sp01;
    wH: number;
    gH01: number;
    gH02: number;
    groupsGrid: any;
    groups: DataStore;
    groups_accessGrid: any;
    groups_access: DataStore;
    programsList: any;

    constructor(private toastr: ToastrService, private dialog: MatDialog, private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private w2uiH: w2uiHelperService) {}

    ngAfterViewInit() {
        window.onresize = (e) => {this.onResize(e)} // Capture resize event
        this.onResize(null);

        this.groups = this.dESrvc.newDataStore('groups', ['fgroupid'], true, ['fname']);
        this.dESrvc.validateDataStore('groups', 'GROUP RIGHT', 'fname', 'NAME');
        this.groups_access = this.dESrvc.newDataStore('groups_access', ['fgroupid', 'fprogid'], true, ['fgroupid', 'fprogid']);

        this.initGrids();
        $(document).ready(() => {
            this.DataSvc.serverDataGet('api/GroupsMaint/GetGroups').subscribe((dataResponse) => {
                this.w2uiH.gridInit(this.groupsGrid); // Set Default Values & Prepare
                this.w2uiH.gridInit(this.groups_accessGrid); // Set Default Values & Prepare

                this.groups.loadData(dataResponse.groups);
                this.groups_access.loadData(dataResponse.groups_access);

                this.w2uiH.gridLoad(this.groupsGrid, this.groups.items);
                this.onResize(null); // Refresh Grids
            });

            // Get Programs for List
            this.DataSvc.serverDataGet('api/GroupsMaint/GetPrograms').subscribe((dataResponse) => {
                this.programsList = dataResponse;
            });
        });

    }

    ngOnDestroy() {
        this.w2uiH.gridDestroy(this.groupsGrid);
        this.w2uiH.gridDestroy(this.groups_accessGrid);

        this.groups.clearData();
        this.groups_access.clearData();
    }

    update() {
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/GroupsMaint/Postupdate').finally(() => {
            this.CompanySvc.ofHourGlass(false);
        }).subscribe();
    }

    groups_accessFilter(pfgroupid): any[] {
        return this.$filter.transform(this.groups_access.items, {fgroupid: pfgroupid}, true);
    }

    groupsAdd() {
        this.groups.addRow({
            fgroupid: this.dESrvc.getMaxValue(this.groups.items, 'fgroupid') + 1
        });

        this.w2uiH.gridLoad(this.groupsGrid, this.groups.items, false); // Load Data, no refresh, since scroll will doit
        this.w2uiH.gridScrollToLastRow(this.groupsGrid, 1); // Scroll to new row & edit
    }

    groupsRemove(event) {
        // Make sure no details exist
        if (this.groups_accessGrid.rowCount() > 0) {
            this.toastr.warning('Must First Remove All PROGRAMS');
            return;
        }

        var ret = this.w2uiH.removeGridRow(this.groupsGrid, this.groups);
        if (ret) {
            // Row was removed clear rows
            ret.subscribe(()=> {
                this.w2uiH.gridLoad(this.groups_accessGrid, []);
            });
        }
    }

    groups_accessAdd() {
        var row = this.w2uiH.getGridSelectecRow(this.groupsGrid);
        if (!row) return; // Invalid

        let dialogRef: MatDialogRef<ListPrograms>;
        dialogRef = this.dialog.open(ListPrograms);
        dialogRef.componentInstance.programsGridData = this.programsList;
        dialogRef.afterClosed().subscribe((retValue)=> {
            if (retValue) {
                var currentRows = this.groups_accessGrid.api.records;
                // exit if already exists
                if (this.$filter.transform(currentRows, {fprogid: retValue.fprogid}, true).length > 0) return;

                this.groups_access.addRow({
                    fgroupid: row.fgroupid,
                    fprogid: retValue.fprogid,
                    cfname: retValue.fname,
                    fsequence: this.dESrvc.getMaxValue(currentRows, 'fsequence') + 1,
                    fupdate: false,
                    fadmin: false
                });

                this.w2uiH.gridLoad(this.groups_accessGrid, this.groups_accessFilter(row.fgroupid), false); // Load Data, no refresh
                this.w2uiH.gridScrollToLastRow(this.groups_accessGrid, 0); // Scroll to new row
            }
        });
    }

    groups_accessRemove(event) {
        var ret = this.w2uiH.removeGridRow(this.groups_accessGrid, this.groups_access, false, false); // Remove but don't reload data
        if (ret) {
            // Row was removed reload using filter
            ret.subscribe(()=> {
                var rec = this.groupsGrid.api.get(this.groupsGrid.api.getSelection()[0]); // get selected master row
                this.w2uiH.gridLoad(this.groups_accessGrid, this.groups_accessFilter(rec.fgroupid)); // Load filtered rows
            });
        }
    }

    fsequenceArrange(pfprogid, pfsequence) {
        var rows = this.groups_accessGrid.api.records;
        // Increment Equal or Greater Values
        for (var i = 0; i < rows.length; i++) {
            var obj = rows[i];
            if (obj.fsequence == null) continue; // Skip
            if (obj.fsequence >= pfsequence && obj.fprogid !== pfprogid) obj.fsequence++; // Increment
        }
        // Get List Sorted and Reasign Sequence Starting with 1
        var nrows = this.filterOrder.transform(rows, 'fsequence');
        var nseq = 0;
        for (var i = 0; i < nrows.length; i++) {
            if (nrows[i].fsequence == null) continue; // Skip
            nseq++;
            nrows[i].fsequence = nseq;
        }
    }

    // Fix to only do it on-ended-resizing
    onSPChange(event) {
        setTimeout(() => this.onResize(null), 100);
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.wH = window.innerHeight - 50;
            this.gH01 = this.sp01.getPrimarySize() - 50;
            this.gH02 = this.sp01.getSecondarySize() - 50;

            this.w2uiH.gridResize(this.groupsGrid);
            this.w2uiH.gridResize(this.groups_accessGrid);
        }, 100);
    };

    initGrids() {
        // w2ui
        this.groupsGrid = {
            name: 'prmgrid01',
            sortable: false,
            singleClickEdit: true,
            onSelect: (event) => {
                if (this.w2uiH.gridSelectChanged(this.groupsGrid, event.recid)) {
                    var row = this.groupsGrid.api.get(event.recid);
                    this.w2uiH.gridLoad(this.groups_accessGrid, this.groups_accessFilter(row.fgroupid)); // Load filtered rows
                }
            },
            columns: [
                {field: "fgroupid", caption: "ID", size: 55},
                {field: "fname", caption: "Name", size: 250, editable: {type: 'text'}}
            ]
        };
        // w2ui
        this.groups_accessGrid = {
            name: 'prmgrid02',
            sortable: false,
            singleClickEdit: true,
            onChange: (event) => {
                var rec = this.groups_accessGrid.api.get(event.recid); // Get row
                switch (event.column) {
                    case 0: // fsequence
                        rec.fsequence = event.value_new;
                        this.fsequenceArrange(rec.fprogid, rec.fsequence);
                        break;
                }
                this.w2uiH.onChangeComplete(event); // Always include
            },
            columns: [
                {field: "fsequence", caption: "Sequence", size: 80, editable: {type: 'int'}},
                {field: "cfname", caption: "Program", size: 250},
                {field: "fupdate", caption: "Update", size: 70, editable: {type: 'checkbox'}},
                {field: "fadmin", caption: "Admin", size: 70, editable: {type: 'checkbox'}}
            ]
        };
    }
}
