import {Component, OnDestroy, AfterViewInit, ViewChild} from '@angular/core';
import {FormControl} from "@angular/forms";
import { DatePipe } from '@angular/common';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
import {ToastrService} from 'toastr-ng2';
import {DataService} from '../services/data.service';
import {SharedService} from '../services/shared.service';
import {DataEntryService, DataStore} from '../services/dataentry.service';
import {CompanyService} from '../services/company.service';
import {w2uiHelperService} from '../services/w2uiHelper.service';
import {agGridHelperService} from '../services/agGridHelper.service';
import {PcdrFilterPipe} from '../pipes/pcdrfilter.pipe';
import { Ng2OrderPipe } from 'ng2-order-pipe';
import { MdDialogRef, MdDialog } from '@angular/material';
import {ListItems} from "../lists/list-items.component";
import {EquipDetails} from "../orderentry/equipmemtdetails.component";
import {EquipmentHistoryList} from "../orderentry/equipmenthistorylist.component";
import {TenderAmount} from "../orderentry/tenderamount.component";
import {ListSODetails} from '../lists/list-sodetails.component';
import {LogEntry} from '../lists/logentry.component';

@Component({
    selector: 'app-orderentry',
    templateUrl: './orderentry.component.html',
    // styleUrls: ['./codemaint.component.css'],
    providers: [DataEntryService, Ng2OrderPipe], // Creates NEW INSTANCE
})
export class OrderentryComponent implements OnDestroy, AfterViewInit {
    //$filter: PcdrFilterPipe = new PcdrFilterPipe();
    @ViewChild('oemsp01') sp01;
    @ViewChild('equipmentListButton') equipmentListButton;
    wH: number;
    gH01: number;
    gH02: number;
    gH03: number;
    gH04: number;

    salesorders: DataStore;
    salesordersCurrent = {};
    salesdetails: DataStore;
    salesdetailsGrid: any;
    addresses: DataStore;
    addressesCurrent = {};
    contactsGrid: any;
    contacts: DataStore;
    salespayments: DataStore;
    solgGrid: any;

    listCustomerGrid: any;
    listSOGrid: any;
    listCustomerGridSearch = new FormControl();
    ctype: string = "P"; // Customer By Phone
    sotype: string = 'C'; // SO by Selected 'C'ustomer
    sostatus: string = 'A'; // SO Status 'A'll
    sodatef: Date = new Date(); // SO datef
    sodatet: Date = new Date(); // SO datet
    orderstatus: any[];
    selectedTab: number = 0;
    searchId: string;
    taxrate: number;
    cityNames: any[]; // AutoComplete fcity

    invoiceFlag: boolean = false;
    voidFlag: boolean = false;
    reopenFlag: boolean = false;

    constructor(private toastr: ToastrService, private CompanySvc: CompanyService, public dESrvc: DataEntryService, private OrderByPipe: Ng2OrderPipe, private DataSvc: DataService, private $filter: PcdrFilterPipe, private sharedSrvc: SharedService, private agH: agGridHelperService, private w2uiH: w2uiHelperService, private dialog: MdDialog, private datePipe: DatePipe) {
        this.initGridsAg();

        this.salesorders = this.dESrvc.newDataStore('sales_order_headers', ['fsoid'], true, ['faid', 'fstatus', 'fdate', 'ftotal']);
        this.salespayments = this.dESrvc.newDataStore('salespayments', ['fsoid', 'fsopid'], true, ['famount', 'ftype']);

        this.salesdetails = this.dESrvc.newDataStore('sales_order_details', ['fsoid', 'fsdid'], true, ['fitemid', 'fdescription', 'fqty', 'famt']);
        this.dESrvc.validateDataStore('sales_order_details', 'DETAILS', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('sales_order_details', 'DETAILS', 'fitemid', 'ITEM');
        this.dESrvc.validateDataStore('sales_order_details', 'DETAILS', 'fqty', 'QUANTITY');
        this.dESrvc.validateDataStore('sales_order_details', 'DETAILS', 'famt', 'PRICE');

        this.contacts = this.dESrvc.newDataStore('contacts', ['fcid', 'faid'], true, ['fname', 'fphone']);
        this.dESrvc.validateDataStore('contacts', 'CONTACTS', 'fname', 'NAME');
        this.dESrvc.validateDataStore('contacts', 'CONTACTS', 'fphone', 'PHONE');

        this.addresses = this.dESrvc.newDataStore('addresses', ['faid'], true, ['fcity', 'fstate']);
        this.dESrvc.validateDataStore('addresses', 'ADDRESS', 'fcity', 'CITY');
        this.dESrvc.validateDataStore('addresses', 'ADDRESS', 'fstate', 'STATE');

        // Code Table
        this.dESrvc.initCodeTable().subscribe(dataResponse => {
            this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'SHS'}, true);
            this.orderstatus.unshift({fid: 'A', fdescription: 'All'}); // Add All

            // AutoComplete
            this.cityNames = this.$filter.transform(dataResponse, {fgroupid: 'CITY'}, true);
            // for (var i = 0; i < this.cityNames.length; i++) {
            //     var obj = this.cityNames[i];
            //     obj.value = obj.fid;
            // }

        });

        // Tax Rate
        this.DataSvc.serverDataGet('api/CompanyMaint/GetTaxRate').subscribe((dataResponse) => {
            this.taxrate = parseFloat(dataResponse.ftaxrate);
        });

        // Subscribe to onchange for search field
        this.listCustomerGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (this.ctype != "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomerList', {pName: val, pType: this.ctype});
            })
            .subscribe(results => {
                this.listCustomerGrid.api.setRowData(results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    ngAfterViewInit() {
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start
        this.initGrids();

        $(document).ready(() => {
            this.w2uiH.gridInit(this.salesdetailsGrid); // Set Default Values & Prepare
            this.w2uiH.gridInit(this.contactsGrid); // Set Default Values & Prepare
            this.w2uiH.gridInit(this.solgGrid); // Set Default Values & Prepare
            this.onResize(null); // Needed always
        });
    }

    ngOnDestroy() {
        this.w2uiH.gridDestroy(this.salesdetailsGrid);
        this.w2uiH.gridDestroy(this.contactsGrid);
    }

    // Valid Entry
    validEntry() {
        if (!this.salesorders) return false;
        return (this.salesorders.items.length === 1);
    }

    update(printdoc = false) {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        if (this.salesorders.items[0].fstatus !== 'O' && this.reopenFlag == false) {
            this.toastr.info('Only OPEN orders can be modified.');
            return;
        }
        // Must have details
        if (this.salesdetails.items.length == 0) {
            this.toastr.info('Orders must have at least ONE detail');
            return;
        }
        // Validate
        if (this.dESrvc.validate() != '') return;

        // Balance must be zero when invoicing
        if (this.invoiceFlag && this.salesorders.items[0].fbalance !== 0) {
            this.invoiceFlag = false;
            this.toastr.info('Balance amount must be Zero.');
            return;
        }

        this.CompanySvc.ofHourGlass(true);

        // Void order if requested
        if (this.voidFlag) {
            this.voidFlag = false;
            this.salesorders.items[0].fstatus = 'V';
        }

        // Reopen order if requested
        if (this.reopenFlag) {
            this.reopenFlag = false;
            this.salesorders.items[0].fstatus = 'O';
        }

        // Complete order if requested
        if (this.invoiceFlag) {
            this.invoiceFlag = false;
            this.salesorders.items[0].fstatus = 'C';
            // Set date if not set
            if (!this.salesorders.items[0].finvoicedate) {
                this.salesorders.items[0].finvoicedate = new Date();
                this.salesorders.items[0].finvoicedate.setHours(12, 0, 0);// Remove time
            }
        }

        // Last Update
        this.salesorders.items[0].flastupdate = new Date();
        this.salesorders.items[0].fby = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/SO/Postupdate')
            .finally(() => this.CompanySvc.ofHourGlass(false))
            .subscribe((dataResponse) => {
                if (dataResponse.success) {
                    // Assign fdocnumber from server
                    if (this.salesorders.items[0].fticket === -1) {
                        if (dataResponse.fdocnumber) {
                            // Assign to current & original flag as no changes
                            this.salesorders.items[0].fticket = dataResponse.fdocnumber;
                            this.salesorders._orgData[0].fticket = dataResponse.fdocnumber;
                        }
                    }
                    if (printdoc) {
                        // Open drawer only if cash was used
                        let opendrawer = (this.salesorders.items[0].famtcash + this.salesorders.items[0].famtchange > 0);
                        this.printSO(opendrawer);
                    }
                }
                else {
                    this.salesorders.items[0].fstatus = 'O'; // Reverse status
                }
            }
        );
    }

    createSO(pCustomer?) {
        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.CompanySvc.ofHourGlass(true);
            this.salesorders.loadData([]);
            this.salesdetails.loadData([]);
            this.salespayments.loadData([]);
            this.addresses.loadData([]);
            this.contacts.loadData([]);
            this.w2uiH.gridLoad(this.salesdetailsGrid, this.salesdetails.items); // Clear Grid

            // Retrieve Existing Customer
            if (pCustomer) {
                this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomer', {pfaid: pCustomer.faid}).subscribe((dataResponse) => {
                    this.addresses.loadData(dataResponse.addresses);
                    this.contacts.loadData(dataResponse.contacts);
                    this.w2uiH.gridLoad(this.contactsGrid, this.contacts.items);
                    this.addressesCurrent = this.addresses.items[0]; // Set pointer
                    this.postCreateSO(pCustomer);
                });
            }
            // Create new customner if not specified.
            else {
                pCustomer = {};
                this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'address'}).subscribe((dataResponse) => {
                    pCustomer.faid = dataResponse.data;
                    pCustomer.fcid = 1;
                    // Create new address using below defaults.
                    this.addresses.addRow({
                        faid: pCustomer.faid,
                        fcity: 'San Antonio',
                        fstate: 'TX',
                        fzip: '78216'
                    });
                    this.addressesCurrent = this.addresses.items[0]; // Set pointer
                    this.postCreateSO(pCustomer, true); // Create new Contact
                });
            }
        });
    }

    postCreateSO(pCustomer, createContact = false) {
        this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'sales_order_header'})
            .finally(() => this.CompanySvc.ofHourGlass(false))
            .subscribe((dataResponse) => {
                var dt = new Date();
                dt.setHours(12, 0, 0);// Remove time

                this.salesorders.addRow({
                    fsoid: dataResponse.data,
                    faid: pCustomer.faid,
                    fcid: pCustomer.fcid,
                    fstatus: 'O', // Open
                    fdate: dt,
                    fticket: -1,
                    fsubtotal: 0,
                    fshipamt: 0,
                    fdiscountamt: 0,
                    ftaxamt: 0,
                    ftotal: 0,
                    famtchange: 0,
                    fnotaxamt: 0,
                    ftotalpayment: 0,
                    fbalance: 0
                });

                this.salesordersCurrent = this.salesorders.items[0]; // Set current view
                if (createContact) this.contactsAdd(); // Add contact if requested
                this.refreshLog();
            }
        );
    }

    customerCreateSO() {
        var row = this.listCustomerGrid.api.getSelectedRows()[0];
        if (!row) {
            this.toastr.info('Customer must be selected.');
            return;
        }

        this.selectedTab = 1;
        this.createSO(row);
    }

    createSOSameCust() {
        if (!this.validEntry()) return;
        this.createSO({faid: this.salesorders.items[0].faid, fcid: this.salesorders.items[0].fcid});
    }

    reopen() {
        if (!this.validEntry()) return;
        if (this.salesorders.items[0].fticket === -1) return; // Only existing orders
        this.reopenFlag = false;

        if (this.salesorders.items[0].fstatus !== 'C') {
            this.toastr.info('Only COMPLETED orders can Re-Open.');
            return;
        }

        this.CompanySvc.confirm('Re-Open this Sales Order?').subscribe((ret) =>{
            if (ret) {
                this.reopenFlag = true; // Set flag
                this.salesorders.items[0].flastupdate = new Date(); // Force update if nothing was changed
                this.update();
            }
        })
    }

    void() {
        if (!this.validEntry()) return;
        if (this.salesorders.items[0].fticket === -1) return; // Only existing orders
        this.voidFlag = false;

        if (this.salesorders.items[0].fstatus !== 'O') {
            this.toastr.info('Only OPEN orders can be void.');
            return;
        }

        this.CompanySvc.confirm('Void this Sales Order?').subscribe((ret) =>{
            if (ret) {
                this.voidFlag = true; // Set flag
                this.salesorders.items[0].flastupdate = new Date(); // Force update if nothing was changed
                this.update();
            }
        })
    }

    // Retrieve specific SO
    searchSONumber() {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/SO/GetValidateSonumber', {pfticket: this.searchId}).subscribe((dataResponse)=> {
            if (dataResponse.length > 0) {
                this.retrieveSO(dataResponse[0].fsoid);
                this.searchId = '';
            }
            else
                this.toastr.info('Ticket Not Found');

            this.CompanySvc.ofHourGlass(false);
        });
    }

    // Ensure grid is displayed
    preRetrieveSO(pfsoid?) {
        if (!pfsoid) {
            let row = this.listSOGrid.api.getSelectedRows()[0];
            if (row) pfsoid = row.fsoid;
        }
        if (!pfsoid) return;

        this.selectedTab = 1;
        //this.gridRepaint('3'); // redraw first just in case
        setTimeout(()=> this.retrieveSO(pfsoid), 0);
    }

    // Get SO for EDIT
    retrieveSO(afsoid) {
        if (!afsoid) return;

        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.CompanySvc.ofHourGlass(true);
            this.DataSvc.serverDataGet('api/SO/GetSO', {pfsoid: afsoid})
                .finally(()=> this.CompanySvc.ofHourGlass(false))
                .subscribe((dataResponse) => {
                    this.salesorders.loadData(dataResponse.sales_order_headers);
                    this.salesdetails.loadData(dataResponse.sales_order_details);
                    this.addresses.loadData(dataResponse.addresses);
                    this.contacts.loadData(dataResponse.contacts);
                    this.salespayments.loadData(dataResponse.salespayments);

                    this.salesordersCurrent = this.salesorders.items[0]; // Set pointer for SO
                    this.addressesCurrent = this.addresses.items[0]; // Set pointer

                    // Calculate Computed Columns
                    this.salesdetailsComputedAll();
                    this.w2uiH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
                    this.w2uiH.gridLoad(this.contactsGrid, this.contacts.items);
                    this.refreshLog(this.salesorders.items[0].fsoid);
                });
        });
    }

    refreshLog(fsoid?) {
        if (!fsoid) {
            this.w2uiH.gridLoad(this.solgGrid, []);
        }
        else {
            this.DataSvc.serverDataGet('api/SO/GetSalesLog', {pfsoid: fsoid}).subscribe((dataResponse) => {
                this.w2uiH.gridLoad(this.solgGrid, dataResponse); // Load filtered rows
            });
        }
    }

    logAdd() {
        if (!this.validEntry()) return;
        let row = this.salesorders.items[0];
        if (row.fticket == -1) return;

        let dialogRef: MdDialogRef<LogEntry>;
        dialogRef = this.dialog.open(LogEntry);
        dialogRef.componentInstance.fsoid = row.fsoid;
        dialogRef.componentInstance.fCodetable = this.dESrvc.codeTable;
        dialogRef.afterClosed().subscribe((retValue)=> {
            if (retValue) this.refreshLog(row.fsoid);
        });
    }

    viewSODetails() {
        let row = this.listSOGrid.api.getSelectedRows()[0];
        if (!row) return;

        let dialogRef: MdDialogRef<ListSODetails>;
        dialogRef = this.dialog.open(ListSODetails);
        dialogRef.componentInstance.fsoid = row.fsoid;
        dialogRef.componentInstance.fticket = row.fticket;
        dialogRef.afterClosed();
    }

    openDrawer() {
        window.location.href = 'pcdrprintpdf:drawer:true'; // open drawer option
    }

    printSO(opendrawer) {
        this.print('d_invoice_sales_order_header', 'fticket', opendrawer);
    }

    printWO() {
        this.print('d_work_order_detail', 'fsoid', false);
    }

    print(dwname, fid, opendrawer) {
        if (!this.validEntry()) return;
        if (this.salesorders.items[0].fticket == -1) return;

        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateReport(dwname, [{fline: 1,fnumber: this.salesorders.items[0][fid]}])
            .subscribe((pResponse) => {
                var filename = pResponse.ffilename;
                // Send to printer
                setTimeout(() => {
                    this.CompanySvc.ofCheckServerFile(pResponse.data, () => {
                        window.location.href = 'pcdrprintpdf:' + filename + ':' + opendrawer; // open drawer option
                    });
                }, 1000);
            }
        );
    }

    showCustomerHistory() {
        if (!this.validEntry()) return;

        this.selectedTab = 0;
        this.sotype = 'C'
        this.listSOGridRefresh(this.salesorders.items[0].faid);
    }

    // Get SO List
    listSOGridRefresh(pfaid?) {
        var faid = pfaid;
        if (this.sotype === 'C' && !faid) {
            if (this.listCustomerGrid.api.getSelectedRows().length == 0) {
                this.toastr.info('Customer must be selected');
                return;
            }
            faid = this.listCustomerGrid.api.getSelectedRows()[0].faid;
        }

        // Set Min and Max Dates
        let datef = (typeof this.sodatef == 'string') ? this.sodatef + " 00:00:00" : this.sodatef;
        if (typeof datef !== 'string') datef.setHours(12, 0, 0); // Zero Time

        let datet = (typeof this.sodatet == 'string') ? this.sodatet + " 23:59:59" : this.sodatet;
        if (typeof datet !== 'string') datet.setHours(23, 59, 59); // 11:59pm

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/SO/GetSOList', {
            psotype: this.sotype,
            pfaid: faid? faid: 1,
            pdatef: datef,
            pdatet: datet,
            pfstatus: this.sostatus
        })
            .subscribe((dataResponse) => {
                this.CompanySvc.ofHourGlass(false);
                this.listSOGrid.api.setRowData(dataResponse);
                this.listSOGridTotal();
                if (dataResponse.length === 0) this.toastr.info('No Rows found');
            });
    }

    listSOGridTotal() {
        var ftotal = 0, fsubtotal = 0;
        var rows = this.agH.getRowData(this.listSOGrid);

        for (var i = 0; i < rows.length; i++) {
            var obj = rows[i];
            if (obj.data.fstatus !== 'V') {
                ftotal += obj.data.ftotal;
                fsubtotal += obj.data.fsubtotal;
            }
        }
        this.listSOGrid.api.setFloatingBottomRowData([{fsubtotal: fsubtotal, ftotal: ftotal}]);
    }

    // Calculate salesdetails computed fields for all rows
    salesdetailsComputedAll() {
        this.salesdetails.items.forEach((item) => {
            this.salesdetailsComputed(item);
        });
    }

    // Calculate salesdetails computed fields 1 row
    salesdetailsComputed(row) {
        row.cextended = this.CompanySvc.r2d(row.fqty * row.famt);
    }

    tender() {
        if (!this.validEntry()) return;
        if (this.salesdetails.items.length == 0) return; // Must have details

        let dialogRef: MdDialogRef<TenderAmount>;
        dialogRef = this.dialog.open(TenderAmount);
        // pointers
        dialogRef.componentInstance.orderentryComponent = this;
        dialogRef.componentInstance.salesorders = this.salesorders.items[0];
        dialogRef.componentInstance.salespayments = this.salespayments;
        dialogRef.componentInstance.quickCashList = this.$filter.transform(this.dESrvc.codeTable, {fgroupid: 'QCP'}, true);
        dialogRef.componentInstance.paymentTypes = this.OrderByPipe.transform(dialogRef.componentInstance.quickCashList, 'forder');
        dialogRef.componentInstance.paymentTypes = this.$filter.transform(this.dESrvc.codeTable, {fgroupid: 'CPT'}, true);
        dialogRef.componentInstance.paymentTypes = this.OrderByPipe.transform(dialogRef.componentInstance.paymentTypes, 'forder');
        dialogRef.afterClosed().subscribe((retValue) => {
            if (retValue) {
                if (this.salesorders.items[0].fstatus !== 'O') return; // Not an open order exit
                this.invoiceFlag = true; // Set flag
                this.salesorders.items[0].flastupdate = new Date(); // Force update if nothing was changed
                this.update(true);
            }
        });
    }

    // Calculate totals for salesorders
    salesordersTotals() {
        var so = this.salesorders.items[0]; // shrotcut
        so.fsubtotal = 0;
        so.ftaxamt = 0;
        so.ftotal = 0;
        so.fnotaxamt = 0;
        so.fbalance = 0;
        so.fdiscountamt = 0;
        so.famtchange = 0;
        so.ftotalpayment = 0;

        // Loop details
        this.salesdetails.items.forEach((item) => {
            if (item.ftaxable)
                so.fsubtotal += item.cextended;
            else
                so.fnotaxamt += item.cextended;
        });
        so.ftaxamt = this.CompanySvc.r2d(this.taxrate * so.fsubtotal);
        so.fsubtotal = this.CompanySvc.r2d(so.fsubtotal + so.fnotaxamt);
        // TODO calculate discount
        so.ftotal = this.CompanySvc.r2d(so.fsubtotal + so.ftaxamt);

        // Loop payments
        this.salespayments.items.forEach((item) => {
            so.ftotalpayment += item.famount;
        });
        so.ftotalpayment = this.CompanySvc.r2d(so.ftotalpayment);

        // Calculate change and re-assign ftotalpayment
        if (so.ftotalpayment > so.ftotal) {
            so.famtchange = this.CompanySvc.r2d(so.ftotalpayment - so.ftotal);
            so.ftotalpayment = so.ftotal;
        }

        so.fbalance = this.CompanySvc.r2d(so.ftotal - so.ftotalpayment);
    }

    salesdetailsSetItem(row, datarow) {
        row.fitemid = datarow.fitemid;
        row.fdescription = datarow.fdescription;
        row.famt = datarow.fprice;
        row.ftaxable = datarow.ftaxable;

        this.salesdetailsComputed(row);
        this.salesordersTotals();
        this.salesdetailsGrid.api.refreshRow(row.recid);
        // this.salesdetailsGrid.api.refresh();

        if (row.fitemid == 'E') {
            this.equipmentListButton.nativeElement.click();
            // this.equipmentList(); // Not working since event is inside w2grid maybe.
        }
        else {
            this.w2uiH.gridScrollToRow(this.salesdetailsGrid, 1, row);
        }
    }

    equipmentList() {
        let row = this.w2uiH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) return;

        this.DataSvc.serverDataGet('api/SO/GetPastEquipment', {pfaid: this.salesorders.items[0].faid}).subscribe((dataresponse) => {
            if (dataresponse.length > 0) { // Only if records exist
                let dialogRef: MdDialogRef<EquipmentHistoryList>;
                dialogRef = this.dialog.open(EquipmentHistoryList);
                dialogRef.componentInstance.itemsGridData = dataresponse;
                dialogRef.afterClosed().subscribe((retValue) => {
                    if (retValue) {
                        // Copy Selected Row
                        row.fbrand = retValue.fbrand;
                        row.fmodel = retValue.fmodel;
                        row.fpctype = retValue.fpctype;
                    }
                    this.viewEquipment(row);
                });
            }
            else this.viewEquipment(row);
        });
    }

    itemsList() {
        if (!this.validEntry()) return;
        let sRow = this.w2uiH.getGridSelectecRow(this.salesdetailsGrid);
        if (!sRow) return;

        let dialogRef: MdDialogRef<ListItems>;
        dialogRef = this.dialog.open(ListItems);
        dialogRef.afterClosed().subscribe((retValue)=> this.salesdetailsSetItem(sRow, retValue));
    }

    viewEquipment(row) {
        if (!this.validEntry()) return;
        if (!row) {
            row = this.w2uiH.getGridSelectecRow(this.salesdetailsGrid);
            if (!row) return;
        }
        if (row.fitemid !== 'E') return;  // Only equipment

        let dialogRef: MdDialogRef<EquipDetails>;
        dialogRef = this.dialog.open(EquipDetails);
        dialogRef.componentInstance.pcnames = this.$filter.transform(this.dESrvc.codeTable, {fgroupid: 'PC'}, true);
        dialogRef.componentInstance.pctypes = this.$filter.transform(this.dESrvc.codeTable, {fgroupid: 'SDT'}, true);
        dialogRef.componentInstance.sodetails = row;
        dialogRef.afterClosed().subscribe();
    }

    displayContact() {
        if (this.salesorders.items.length == 0) return;

        let contact = ''
        let row = this.$filter.transform(this.contacts.items, {fcid: this.salesorders.items[0].fcid}, true)[0];
        if (row) {
            contact = (row.fname) ? row.fname + ' ' + this.CompanySvc.phoneRenderer({value: row.fphone}) : '';
        }
        return contact;
    }

    displayOrderStatus() {
        if (!this.validEntry()) return '';
        let ordstatus = ''
        let row = this.$filter.transform(this.orderstatus, {fid: this.salesorders.items[0].fstatus}, true)[0];
        if (row) ordstatus = row.fdescription;
        return ordstatus;
    }

    salesdetailsAdd() {
        if (!this.validEntry()) return;

        this.salesdetailsAddRow(this.dESrvc.getMaxValue(this.salesdetails.items, 'fsequence') + 1);
        this.w2uiH.gridLoad(this.salesdetailsGrid, this.salesdetails.items, false); // Load Data, no refresh
        this.w2uiH.gridScrollToLastRow(this.salesdetailsGrid, 0); // Focus
    }

    salesdetailsAddRow(pfsequence) {
        return this.salesdetails.addRow({
            fsdid: this.dESrvc.getMaxValue(this.salesdetails.items, 'fsdid') + 1,
            fsequence: pfsequence,
            fsoid: this.salesorders.items[0].fsoid,
            faid: this.salesorders.items[0].faid,
            fqty: 1,
            ftaxable: 0,
            famt: 0,
            fnocharger: false
        });
    }

    salesdetailsInsert() {
        if (!this.validEntry()) return;
        let sRow = this.w2uiH.getGridSelectecRow(this.salesdetailsGrid);
        if (!sRow) return;

        // Resequence starting current #
        let newSeq = sRow.fsequence; // Assign highlighted value
        for (var i = 0; i < this.salesdetails.items.length; i++) {
            var obj = this.salesdetails.items[i];
            if (obj.fsequence >= newSeq) obj.fsequence = obj.fsequence + 1; // Change same or >
        }

        let nIdx = this.salesdetailsAddRow(newSeq); // Addrow
        let nRow = this.salesdetails.items[nIdx - 1]; // Get new row, since recid will change after gridLoad()
        this.w2uiH.gridLoad(this.salesdetailsGrid, this.OrderByPipe.transform(this.salesdetails.items, 'fsequence'), false); // Load Data, after sorted
        this.w2uiH.gridScrollToRow(this.salesdetailsGrid, 0, nRow);
    }

    salesdetailsRemove() {
        if (!this.validEntry()) return;
        let row = this.w2uiH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) return;

        var retRx = this.w2uiH.removeGridRow(this.salesdetailsGrid, this.salesdetails); // remove only new contacts
        if (retRx) retRx.subscribe(()=> this.salesordersTotals()); // Reevaluate Totals
    }

    contactsAdd() {
        if (!this.validEntry()) return;

        this.contacts.addRow({
            fcid: this.dESrvc.getMaxValue(this.contacts.items, 'fcid') + 1,
            faid: this.salesorders.items[0].faid
        });
        this.w2uiH.gridLoad(this.contactsGrid, this.contacts.items, false); // Load rows
        this.w2uiH.gridScrollToLastRow(this.contactsGrid, 0);
    }

    contactsRemove() {
        if (!this.validEntry()) return;
        this.w2uiH.removeGridRow(this.contactsGrid, this.contacts, true); // remove only new contacts
    }

    contactsAssign() {
        if (!this.validEntry()) return;
        var row = this.w2uiH.getGridSelectecRow(this.contactsGrid);
        if (!row) return; // No selected row

        this.salesorders.items[0].fcid = row.fcid;
    }

    // Fix to only do it on-ended-resizing
    onSPChange(event) {
        setTimeout(() => this.onResize(null), 100);
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.wH = window.innerHeight - 50;
            this.gH01 = this.sp01.getPrimarySize() - 100;
            this.gH02 = this.sp01.getSecondarySize() - 100;
            this.gH03 = window.innerHeight - (250 + 250);
            this.gH04 = window.innerHeight - 330;

            this.w2uiH.gridResize(this.salesdetailsGrid);
            this.w2uiH.gridResize(this.contactsGrid);
            this.w2uiH.gridResize(this.solgGrid);
        }, 10);
    };

    // Allows w2grid to repaint properly due to multiple tabs
    gridRepaint(pgrid) {
        if (pgrid == '3') {
            this.w2uiH.redrawGrid(this.salesdetailsGrid);
            this.w2uiH.redrawGrid(this.solgGrid);
        }
        if (pgrid == '4') this.w2uiH.redrawGrid(this.contactsGrid);
    }

    initGridsAg() {
        // agGrid
        this.listCustomerGrid = {
            onCellDoubleClicked: ((params) => this.listSOGridRefresh()),
            enableFilter: true,
            columnDefs: [
                {field: "faid", headerName: "ID", width: 60},
                {field: "fname", headerName: "Name", width: 250},
                {field: "fphone", headerName: "Phone", width: 115, cellRenderer: this.CompanySvc.phoneRenderer},
                {field: "femail", headerName: "Email", width: 250},
                {field: "faddress", headerName: "Address", width: 250}
            ]
        };
        this.agH.gridInit(this.listCustomerGrid); // Set Default Values

        // agGrid
        this.listSOGrid = {
            onCellDoubleClicked: ((params) => this.preRetrieveSO(params.data.fsoid)),
            onAfterFilterChanged: () => {
                this.listSOGridTotal();
                console.log('onAfterFilterChanged', this.listSOGrid.api.getModel());
            },
            floatingBottomRowData: [],
            enableFilter: true,
            columnDefs: [
                {field: "fticket", headerName: "S.O.#", width: 80},
                {field: "fdate", headerName: "Date", width: 90, cellRenderer: (params) => this.CompanySvc.dateRenderer(params)},
                {field: "finvoicedate", headerName: "Completed", width: 120, cellRenderer: (params) => this.CompanySvc.dateRenderer(params)},
                {field: "cfstatus", headerName: "Status", width: 100},
                {field: "fname", headerName: "Customer", width: 300},
                {field: "fsubtotal", headerName: "Sub Total", width: 130, cellRenderer: (params) => this.CompanySvc.currencyRenderer(params), cellClass: 'text-right'},
                {field: "ftotal", headerName: "Total", width: 100, cellRenderer: (params) => this.CompanySvc.currencyRenderer(params), cellClass: 'text-right'}
            ]
        };
        this.agH.gridInit(this.listSOGrid); // Set Default Values
    }

    initGrids() {
        // w2grid
        this.salesdetailsGrid = {
            name: 'oemg03',
            sortable: false,
            singleClickEdit: true,
            onChange: (event) => {
                var rec = this.salesdetailsGrid.api.get(event.recid); // Get row
                switch (event.column) {
                    case 3: //'fqty':
                        rec.fqty = this.CompanySvc.validNumber(event.value_new.toString(), 2); // Convert to number
                        this.salesdetailsComputed(rec);
                        this.salesordersTotals();
                        break;
                    case 2: //'famt':
                        rec.famt = this.CompanySvc.validNumber(event.value_new.toString(), 2); // Convert to number
                        this.salesdetailsComputed(rec);
                        this.salesordersTotals();
                        break;
                    case 4: //'ftaxable':
                        rec.ftaxable = (event.value_new) ? 1 : 0;
                        event.value_new = rec.ftaxable; // Set to number
                        this.salesdetailsComputed(rec);
                        this.salesordersTotals();
                        break;
                    case 0: // fitemid
                        if (!event.value_new || event.value_new.lenght == 0) break;
                        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItem', {pfitem: event.value_new}).subscribe((dataresponse) => {
                            if (dataresponse.length == 0) {
                                rec.fitemid = null;
                                //this.w2uiH.gridScrollToRow(this.salesdetailsGrid, 0, rec, true); // Focus
                                this.toastr.info('Invalid Item');
                                return;
                            }
                            this.salesdetailsSetItem(rec, dataresponse[0]);
                        });
                        break;
                }

                this.w2uiH.onChangeComplete(event); // Always include
            },
            onEditField: (event) => {
                switch (event.column) {
                    case 1: // fdescription
                    case 2: // fprice
                        if (this.salesdetails.items[event.index].fitemid == 'E') { event.preventDefault() }
                        break;
                }
            },
            columns: [
                {field: "fitemid", caption: "Item", size: 150, editable: {type: 'text'}},
                {field: "fdescription", caption: "Description", size: 350, editable: {type: 'text'}},
                {field: "famt", caption: "Price", size: 80, editable: {type: 'money'}, render: 'money'},
                {field: "fqty", caption: "Qty", size: 50, editable: {type: 'float'}},
                {field: "ftaxable", caption: "Tax", size: 70, editable: {type: 'checkbox'}},
                // Computed column
                {field: "cextended", caption: "Extended", size: 100, render: 'money'}
            ]
        };

        // w2grid
        this.contactsGrid = {
            name: 'oemg04',
            sortable: false,
            singleClickEdit: true,
            columns: [
                {field: "fphone", caption: "Phone", size: 115, editable: {type: 'text'},
                    render: (record) => {return this.CompanySvc.phoneRenderer({value: record.fphone})}},
                {field: "fname", caption: "Name", size: 300, editable: {type: 'text'}},
                {field: "femail", caption: "Email", size: 300, editable: {type: 'text'}}
            ]
        };

        // w2ui
        this.solgGrid = {
            name: 'oemg05',
            sortable: false,
            columns: [
                { field: "fdate", caption: "On", size: 170, render: (record) => {
                    return this.datePipe.transform(record.fdate, 'MM/dd/yyyy h:mm a');
                }},
                { field: "fby", caption: "By", size: 100},
                { field: "cfaction", caption: "Action", size: 185},
                { field: "fnotes", caption: "Notes", size: 750}
            ]
        };
    }
}