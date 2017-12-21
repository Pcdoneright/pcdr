import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { w2uiHelperService } from '../../services/w2uiHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';

@Component({
	selector: 'app-codemaint',
	templateUrl: './codemaint.component.html',
	styleUrls: ['./codemaint.component.css'],
	providers: [DataEntryService],
})
export class CodeMaintComponent implements OnDestroy, AfterViewInit {
	$filter: PcdrFilterPipe  = new PcdrFilterPipe();
	@ViewChild('cdmsp01') sp01;
	wH: number;
	gH01: number;
	gH02: number;
	codemasterGrid: any;
	codedetailGrid: any;
	codedetail: DataStore;
    prevResize = 0; // Fix a but with horizontal-split-pane

	constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, private w2uiH: w2uiHelperService) { }

	ngAfterViewInit() {
		window.onresize = (e) => { this.onResize(e) } // Capture resize event
		this.onResize(null); // Execute at start

		this.codedetail = this.dESrvc.newDataStore('code_detail', ['fgroupid', 'fid'], true, ['fid']);

		this.initGrids();
		$(document).ready(() => {
			this.DataSvc.serverDataGet('api/CodeMaint/GetCode').subscribe((dataResponse) => {
				this.w2uiH.gridInit(this.codemasterGrid); // Set Default Values & Prepare
				this.w2uiH.gridInit(this.codedetailGrid); // Set Default Values & Prepare

				this.codedetail.loadData(dataResponse.code_detail);

				this.w2uiH.gridLoad(this.codemasterGrid, dataResponse.code_master);
                this.onResize(null); // Refresh Grids
			});
		});

	}

	ngOnDestroy() {
		this.w2uiH.gridDestroy(this.codemasterGrid);
		this.w2uiH.gridDestroy(this.codedetailGrid);
	}

	update() {
		if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/CodeMaint/Postupdate').finally(() => {
			this.CompanySvc.ofHourGlass(false);
		}).subscribe();
    }

	codedetailFilter(pfgroupid) :any[] {
		return this.$filter.transform(this.codedetail.items, { fgroupid: pfgroupid }, true);
	}

	codeAdd(event) {
		// Get selected parent row if any
		var row = this.codemasterGrid.api.get(this.codemasterGrid.api.getSelection()[0]);
		if (!row) return;

		this.CompanySvc.inputDialog('Detail ID').subscribe((value) => {
			if (value) {
				this.codedetail.addRow({
					fgroupid: row.fgroupid,
					fid: value
				});
				this.w2uiH.gridLoad(this.codedetailGrid, this.codedetailFilter(row.fgroupid)); // Load filtered rows
				this.w2uiH.gridScrollToLastRow(this.codedetailGrid, 1);
			}
		});
	}

	codeRemove() {
		var ret = this.w2uiH.removeGridRow(this.codedetailGrid, this.codedetail, false, false);

		if (ret) {
			var rec = this.codemasterGrid.api.get(this.codemasterGrid.api.getSelection()[0]); // get selected master row
			// Row was removed reload with proper filter
			ret.subscribe(()=> {
				this.w2uiH.gridLoad(this.codedetailGrid, this.codedetailFilter(rec.fgroupid)); // Load filtered rows
			});
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

            if (this.prevResize !== this.gH01) {
                this.prevResize = this.gH01;
                this.w2uiH.gridResize(this.codemasterGrid);
                this.w2uiH.gridResize(this.codedetailGrid);
            }
		}, 100);
	};

	initGrids() {
		// w2ui
		this.codemasterGrid = {
			name: 'cdmgrid01',
			sortable: false,
			singleClickEdit: true,
			onSelect: (event) => {
				if (this.w2uiH.gridSelectChanged(this.codemasterGrid, event.recid)) {
					var row = this.codemasterGrid.api.get(event.recid);
					this.w2uiH.gridLoad(this.codedetailGrid, this.codedetailFilter(row.fgroupid)); // Load filtered rows
				}
			},
			columns: [
				{ field: "fgroupid", caption: "Group", size: 150 },
				{ field: "fdescription", caption: "Description", size: 300 }
			]
		};
		// w2ui
		this.codedetailGrid = {
			name: 'cdmgrid02',
			sortable: false,
			singleClickEdit: 1,
			// onEditField: (event) => {
			// 	switch (event.column) {
			// 		case 0: // fid
			// 			var rec = this.w2uiH.getGridRow(event);
			// 			if (rec.fid)
			// 				if (!this.codedetail.isNew(rec)) event.preventDefault(); // Modify new only
			// 			break;
			// 	}
			// },
			// onChange: (event) => {
            //     var rec = this.w2uiH.getGridRow(event);
            //     switch (event.column) {
            //         case 0:
			// 			if (event.value_new)
			// 				event.value_new = event.value_new.toUpperCase(); // Convert to Ucase
            //             break;
            //     }

            //     this.w2uiH.onChangeComplete(event); // Always include
            // },
			columns: [
				{ field: "fid", caption: "ID", size: 200 },
				{ field: "fdescription", caption: "Description", size: 250, editable: { type: 'text' } },
				{ field: "fopt1", caption: "Option 1", size: 150, editable: { type: 'text' } },
				{ field: "fopt2", caption: "Option 2", size: 150, editable: { type: 'text' } },
				{ field: "forder", caption: "Sequence", size: 100, editable: { type: 'text' } }
			]
		};
	}
}