import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ToastrService } from 'toastr-ng2';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { w2uiHelperService } from '../../services/w2uiHelper.service';

@Component({
	selector: 'app-usermaint',
	templateUrl: './usermaint.component.html',
	styleUrls: ['./usermaint.component.css'],
	providers: [DataEntryService]
})
export class UserMaintComponent implements OnInit, OnDestroy, AfterViewInit {
	gHeight: number;
	userGrid: any;
	user: DataStore;
	groups: any[];

	constructor(private toastr: ToastrService, private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, private w2uiH: w2uiHelperService) {}

	ngOnInit() {
        // Data Stores, Unique Keys, updatable, validate fields
        this.user = this.dESrvc.newDataStore('user', ['fuid'], true, ['fgroupid', 'fpassword', 'ffirst', 'flast']);
        this.dESrvc.validateDataStore('user', 'USERS', 'fgroupid', 'ACCESS GROUP');
        this.dESrvc.validateDataStore('user', 'USERS', 'fpassword', 'PASSWORD');
        this.dESrvc.validateDataStore('user', 'USERS', 'ffirst', 'FIRST NAME');
        this.dESrvc.validateDataStore('user', 'USERS', 'flast', 'LAST NAME');

        this.initGrids();
    }

	ngAfterViewInit(){
		window.onresize = (e) => {this.onResize(e)} // Capture resize event
        this.onResize(null); // Execute at start

		// Allow JQuery to recognize DOM
		$(document).ready(()=> {
			this.DataSvc.serverDataGet('api/UserMaint/GetGroups').subscribe((dataResponse) => {
				this.groups = dataResponse;
				this.userGrid.columns[2].editable = { type: 'select', items: this.groups };

				this.DataSvc.serverDataGet('api/UserMaint/Getlist').subscribe((data) => {
					this.w2uiH.gridInit(this.userGrid); // Set Default Values & Prepare
					this.user.loadData(data);
					this.w2uiH.gridLoad(this.userGrid, this.user.items);
				});
			});
		});
	}

	ngOnDestroy() {
		this.w2uiH.gridDestroy(this.userGrid);
	}

	update() {
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/userMaint/Postupdate').finally(() => {
			this.CompanySvc.ofHourGlass(false);
		}).subscribe();
    }

	userAdd() {
        var rec = this.user.addRow({
            recid: this.dESrvc.getMaxValue(this.user.items, 'recid') + 1, // Needed by grid
            fuid: this.dESrvc.getMaxValue(this.user.items, 'fuid') + 1,
            factive: true,
            fisadmin: false
        });

        this.w2uiH.gridLoad(this.userGrid, this.user.items, false); // Load Data, no refresh
        this.w2uiH.gridScrollToLastRow(this.userGrid, 2, true); // Focus
    }

	userRemove() {
        this.w2uiH.removeGridRow(this.userGrid, this.user).subscribe(); // must subscribe
	}

	// Resize gridlist to fill window
	onResize(event) {
		setTimeout(() => {
			this.gHeight = window.innerHeight - 100;
			this.w2uiH.gridResize(this.userGrid);
		}, 100);
	};

	initGrids() {
        //w2ui
        this.userGrid = {
            name: 'umgrid01',
            sortable: false,
            singleClickEdit: true,
            columns: [
                {field: "factive", caption: "Active", size: 70, editable: { type: 'checkbox' }},
                {field: "fisadmin", caption: "Admin", size: 70, editable: { type: 'checkbox' }},
                {field: "fgroupid", caption: "Access Group", size: 150, render: (record, index, col_index) => {
                    for (var p in this.groups) {
                        if (this.groups[p].id == this.userGrid.api.getCellValue(index, col_index)) {return this.groups[p].text;}
                    }
                    return '';
                }},
                {field: "fuserid", caption: "ID", size: 150, editable: { type: 'text' }},
                {field: "fpassword", caption: "Password", size: 150, render: () => {return '*******';}, editable: { type: 'text' }},
                {field: "ffirst", caption: "First Name", size: 200, editable: { type: 'text' }},
                {field: "flast", caption: "Last Name", size: 200, editable: { type: 'text' }},
            ]
        };
	}
}