import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ToastrService } from 'toastr-ng2';
import { SharedService } from '../services/shared.service';
import { DataService } from '../services/data.service';
import { DataEntryService, DataStore } from '../services/dataentry.service';
import { PcdrFilterPipe } from '../pipes/pcdrfilter.pipe';
import { CompanyService } from '../services/company.service';

@Component({
    selector: 'logentry',
    template: `
        <!--<h1 md-dialog-title style="min-width: 600px">Order Log Entry</h1>-->
        <nav class="navbar navbar-toggleable-md navbar-inverse bg-primary" style="width: 550px;">
            <span>Order Log Entry</span>
        </nav>
        <div md-dialog-content Xstyle="padding: 0 5px;">
            <form #logForm="ngForm" novalidate autocomplete="off">
                <div class="form-group">
                    <label>Action</label>
                    <select class="form-control" [(ngModel)]="sologF.faction" [ngModelOptions]="{standalone: true}" required>
                        <option *ngFor="let obj of logActions" [value]="obj.fid">{{obj.fdescription}}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea type="text" class="form-control" [(ngModel)]="sologF.fnotes" [ngModelOptions]="{standalone: true}" required></textarea>
                </div>
            </form>
            {{solog[0]}}
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">Cancel</button>
            <button type="button" class="btn btn-primary" type="submit" (click)="onYes()">Accept</button>
        </div>
    `,
    providers: [DataService, DataEntryService],
})
export class LogEntry implements OnInit, AfterViewInit{
    fsoid: number;
    fCodetable: any[];
    logActions: any[];
    solog: DataStore;
    sologF: any;

    constructor(private toastr: ToastrService, public dialogRef: MatDialogRef<LogEntry>, private sharedSrvc: SharedService, private DataSvc: DataService, private dESrvc: DataEntryService, public $filter: PcdrFilterPipe, private CompanySvc: CompanyService) {}

    ngOnInit() {
        this.logActions = this.$filter.transform(this.fCodetable, {fgroupid: 'SOL'}, true);
        this.solog = this.dESrvc.newDataStore('sales_order_logs', ['fsoid', 'flogid'], true, ['faction', 'fnotes']);
        this.solog.addRow({
            fsoid: this.fsoid,
            flogid: null,
            faction: null,
            fnotes: null,
            fdate: null,
            fby: this.sharedSrvc.user['fname']
        });
        this.sologF = this.solog.items[0]; // Point to item since ng2 complains if using array

        this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'solog'}).subscribe((dataResponseSeq) => {
            this.solog.items[0].flogid = dataResponseSeq.data;
        });
    }

    ngAfterViewInit() {
        // $(document).ready(() => {
        // });
    }

    onYes() {
        if (!this.solog.items[0].faction || !this.solog.items[0].fnotes) {
            this.toastr.warning('Please fill missing values!')
            return;
        }

        if (this.dESrvc.validate() !== '') return;
        this.CompanySvc.ofHourGlass(true);
        this.solog.items[0].fdate = new Date(); // Set Update Datetime
        // Send to Server
        this.dESrvc.update('api/SO/PostupdateSalesLog', false).finally(() => {
            this.CompanySvc.ofHourGlass(false);
        }).subscribe((dataResponse) => {
            if (dataResponse.success) {
                this.dialogRef.close(true);
            }
            else {
                this.dialogRef.close(false);
            }
        });
    }
}
