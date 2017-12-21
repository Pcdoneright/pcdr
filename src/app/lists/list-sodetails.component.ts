import { MatDialogRef } from '@angular/material';
import { Component, AfterViewInit } from '@angular/core';
import {w2uiHelperService} from '../services/w2uiHelper.service';
import { DataService } from '../services/data.service';
import { CompanyService } from '../services/company.service';

@Component({
    selector: 'list-sodetails',
    template: `
        <!--<h1 md-dialog-title style="min-width: 350px">Program List</h1>-->
        <div md-dialog-content style="width: 750px; padding: 0 5px;">
            <div layout="column" class="widget-grid panel-nobox">
                <nav class="navbar navbar-toggleable-md navbar-inverse bg-primary">
                    <span class="text-nowrap">Order Details For Ticket # {{fticket}}</span>
                    <div class="container"></div>
                    <span class="text-nowrap">Rows: {{totalRows}}</span>
                </nav>
                <div id="lsodgrid01" style="height: 400px"></div>
            </div>
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-primary" type="submit" (click)="dialogRef.close()">Continue</button>
        </div>
    `
})
export class ListSODetails implements AfterViewInit{
    fsoid: any;
    fticket: any;
    sodGrid: any;
    totalRows = 0;

    constructor(public dialogRef: MatDialogRef<ListSODetails>, private w2uiH: w2uiHelperService, private DataSvc: DataService, private CompanySvc: CompanyService) {}

    ngAfterViewInit() {
        this.initGrids();

        $(document).ready(() => {
            this.w2uiH.gridInit(this.sodGrid); // Set Default Values & Prepare
            this.DataSvc.serverDataGet('api/SO/GetSalesdetails', {pfsoid: this.fsoid}).subscribe((dataResponse) => {
                this.totalRows = dataResponse.length;
                this.w2uiH.gridLoad(this.sodGrid, dataResponse);
            });
        });
    }

    initGrids() {
        // w2ui
        this.sodGrid = {
            name: 'lsodgrid01',
            columns: [
                {field: "fitemid", caption: "Item", size: 150},
                {field: "fdescription", caption: "Description", size: 350, render: (record) => {
                    if (record.fitemid == "E") return record.fbrand + " " + ((record.fmodel)? record.fmodel:"");
                    return record.fdescription;
                }},
                {field: "famt", caption: "Price", size: 80, render: 'money'},
                {field: "fqty", caption: "Qty", size: 50, render: 'float'},
                {field: "ftaxable", caption: "Tax", size: 70, render: (record) => {
                    return '<input type="checkbox" style="width: 100%"' + ((record.ftaxable) ? 'checked': '') + ' onclick="return false" />';
                }},
                // Computed column
                {field: "cextended", caption: "Extended", size: 100, style: 'text-align: right', render: (record) => {
                    return this.CompanySvc.currencyRenderer({value: record.fqty * record.famt});
                }}
            ]
        };
    }
}
