import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// External Utilities
import { ToastrModule } from 'toastr-ng2';
import { Ng2OrderModule, Ng2OrderPipe } from 'ng2-order-pipe';
import { MatCheckboxModule, MatTabsModule, MatDialogModule, MatRadioModule, MatTooltipModule} from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SplitPaneModule } from 'ng2-split-pane/lib/ng2-split-pane';
import { AgGridModule } from "ag-grid-angular/main";
import { NguiAutoCompleteModule } from '@ngui/auto-complete';
import { WjGridModule } from 'wijmo/wijmo.angular2.grid';
import { WjInputModule } from 'wijmo/wijmo.angular2.input';
// import { jqxGridComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';

// Application
// import {OrderByPipe} from "./pipes/orderBy"
import { CustomModule } from './appcustom.module';
import { routes } from './app.router';
import { SharedService } from './services/shared.service';
import { ConfirmDialog } from './services/confirm-dialog.component';
import { InputDialog } from './services/dialog-input.component';
import { CompanyService } from './services/company.service';
import { DataService } from './services/data.service';
import { w2uiHelperService } from './services/w2uiHelper.service';
import { agGridHelperService } from './services/agGridHelper.service';
import { wjHelperService } from './services/wjHelper.service';
import { PcdrFilterPipe } from './pipes/pcdrfilter.pipe';
import { AppComponent } from './app.component';
import { LoginComponent } from './company/login/login.component';
import { MainMenuComponent } from './mainmenu/mainmenu.component';
import { CodeMaintComponent } from './company/codemaintenance/codemaint.component';
import { UserMaintComponent } from './company/usermaintenance/usermaint.component';
import { ProgMaintComponent } from './company/programrightsmaint/programmaint.component';
import { ListPrograms } from './lists/list-programs.component';
import { ListSODetails } from './lists/list-sodetails.component';
import { ListItems } from './lists/list-items.component';
import { LogEntry } from './lists/logentry.component';
import { WorklistEntryComponent } from './worklistentry/worklistentry.component';
import { OrderentryComponent } from './orderentry/orderentry.component';
import {EquipDetails} from "./orderentry/equipmemtdetails.component";
import {EquipmentHistoryList} from "./orderentry/equipmenthistorylist.component";
import {UppercaseDirective} from "./services/pcdr.directive";
import {TenderAmount} from "./orderentry/tenderamount.component";
import { ItemMaintComponent } from './itemmaint/itemmaint.component';

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		MainMenuComponent,
		ConfirmDialog,
		InputDialog,
		PcdrFilterPipe,
        // OrderByPipe,
        // Ng2OrderModule,
		CodeMaintComponent,
		UserMaintComponent,
		ProgMaintComponent,
        ItemMaintComponent,
        ListPrograms,
        ListSODetails,
        ListItems,
        LogEntry,
        WorklistEntryComponent,
        OrderentryComponent,
        TenderAmount,
        EquipDetails,
        EquipmentHistoryList,
        UppercaseDirective
        //jqxGridComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
        ReactiveFormsModule,
		HttpClientModule,
		BrowserAnimationsModule,
		routes,
		ToastrModule.forRoot({ positionClass: 'toast-bottom-right' }),
        MatCheckboxModule,
        MatRadioModule,
        MatTabsModule,
        MatDialogModule,
        MatTooltipModule,
        FlexLayoutModule,
		SplitPaneModule,
        AgGridModule.withComponents([]),
        NguiAutoCompleteModule,
        Ng2OrderModule,
        WjGridModule,
        WjInputModule
	],
	providers: [
		DatePipe,
        CurrencyPipe,
        Ng2OrderPipe,
		PcdrFilterPipe,
        // OrderByPipe,
        SharedService,
		CompanyService,
        DataService,
		w2uiHelperService,
        agGridHelperService,
        wjHelperService,
		CustomModule
	],
	entryComponents: [
		ConfirmDialog,
		InputDialog,
		CodeMaintComponent,
		UserMaintComponent,
		ProgMaintComponent,
        ItemMaintComponent,
        ListPrograms,
        ListSODetails,
        ListItems,
        LogEntry,
        WorklistEntryComponent,
        OrderentryComponent,
        TenderAmount,
        EquipDetails,
        EquipmentHistoryList
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
