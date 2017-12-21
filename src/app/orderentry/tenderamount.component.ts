import { MatDialogRef } from '@angular/material';
import { Component, AfterViewInit, OnInit} from '@angular/core';
import {DatePipe} from '@angular/common';
import {DataStore} from '../services/dataentry.service';
import {CompanyService} from '../services/company.service';
import {w2uiHelperService} from '../services/w2uiHelper.service';
import {OrderentryComponent} from '../orderentry/orderentry.component';
import {PcdrFilterPipe} from '../pipes/pcdrfilter.pipe';

@Component({
    selector: 'tender-details',
    templateUrl: './tenderamount.component.html',
    styleUrls: ['./tenderamount.component.css']
})
export class TenderAmount implements AfterViewInit, OnInit {
    firstInput: boolean = true;
    tenderamt: string;
    salespaymentsGrid: any;
    salesorders: any;
    salespayments: DataStore;
    paymentTypes: any[];
    quickCashList: any[];
    orderentryComponent: OrderentryComponent;

    constructor(public dialogRef: MatDialogRef<TenderAmount>, private CompanySvc: CompanyService, private w2uiH: w2uiHelperService, private $filter: PcdrFilterPipe, private datePipe: DatePipe) {}

    ngOnInit() {
        this.tenderamt = this.salesorders.fbalance;
    }

    ngAfterViewInit() {
        this.initGrids();
        $(document).ready(() => {
            this.w2uiH.gridInit(this.salespaymentsGrid); // Set Default Values & Prepare
            this.w2uiH.gridLoad(this.salespaymentsGrid, this.salespayments.items);
        });
    }

    onYes() {
        this.dialogRef.close(true);
    }

    tenderAmount(input) {
        // Clear
        if (input == 'C') {
            this.tenderamt = this.salesorders.fbalance;
            this.firstInput = true;
        }
        // Actual Number
        else {
            this.tenderamt = (this.firstInput) ? input : this.tenderamt.toString() + input;
            this.firstInput = false;
        }
    }

    salespaymentRemove() {
        var retRx = this.w2uiH.removeGridRow(this.salespaymentsGrid, this.salespayments);
        if (retRx) retRx.subscribe(()=> {
            this.orderentryComponent.salesordersTotals();
            this.tenderamt = this.salesorders.fbalance;
            this.firstInput = true;
            this.w2uiH.gridLoad(this.salespaymentsGrid, this.salespayments.items);
        });
    }

    addPayment(pType) {
        var mDate = new Date();
        mDate.setHours(12, 0, 0);

        var amount = this.CompanySvc.r2d(Number(this.tenderamt));
        if (amount <= 0) return;
        if (this.salesorders.fbalance == 0) return; // No balance

        // Except for cash, value cannot exceed balance
        if (pType.fid !== 'CSH') {
            amount = Math.min(amount, this.salesorders.fbalance);
        }

        // Find out if payment type already exist with current date, then increment
        var row = this.$filter.transform(this.salespayments.items, {ftype: pType.fid}, true);
        if (row.length > 0 && (this.datePipe.transform(row[0].fdate, 'MM/dd/yyyy') == this.datePipe.transform(mDate, 'MM/dd/yyyy'))) {
            row[0].famount += amount;
        }
        else {
            //  Add row with remaining balance
            this.salespayments.addRow({
                fsoid: this.salesorders.fsoid,
                fsopid: this.orderentryComponent.dESrvc.getMaxValue(this.salespayments.items, 'fsopid') + 1,
                fdate: mDate,
                ftype: pType.fid,
                cftype: pType.fdescription,
                famount: amount
            });
        }

        this.orderentryComponent.salesordersTotals(); // From parent
        this.w2uiH.gridLoad(this.salespaymentsGrid, this.salespayments.items); // Refresh Grid

        this.tenderamt = this.salesorders.fbalance;
        this.firstInput = true;
        // TODO Enter Reference for check 'CHK'
    }

    quickCash(pType) {
        this.tenderamt = pType.fid;
        this.addPayment({fid: 'CSH', fdescription: 'Cash'});
    }

    initGrids() {
        // w2grid
        this.salespaymentsGrid = {
            name: 'oetdrg01',
            sortable: false,
            singleClickEdit: true,
            columns: [
                { field: "fdate", caption: "Date", size: 110, render: (record) => {
                    return this.CompanySvc.dateRenderer({value: record.fdate});
                }},
                {field: "cftype", caption: "Type", size: 150},
                {field: "famount", caption: "Amount", size: 80, render: 'money'},
                {field: "freference", caption: "Reference", size: 100, editable: {type: 'text'}}
            ]
        };
    }
}
