// import {NgModule} from '@angular/core';
import { CodeMaintComponent } from './company/codemaintenance/codemaint.component';
import { UserMaintComponent } from './company/usermaintenance/usermaint.component';
import { ProgMaintComponent } from './company/programrightsmaint/programmaint.component';
import { WorklistEntryComponent } from './worklistentry/worklistentry.component';
import { OrderentryComponent } from './orderentry/orderentry.component';
import { ItemMaintComponent } from './itemmaint/itemmaint.component';

// @NgModule({
//     declarations: [CodeMaintComponent, UserMaintComponent],
//     entryComponents: [CodeMaintComponent, UserMaintComponent],
//     providers: [],
//     exports: []
// })
export class CustomModule {
    ofGetComponent(compName:string) :any {
        switch (compName) {
            case 'codemaintenance':
                return CodeMaintComponent;
            case 'usermaint':
                return UserMaintComponent;
            case 'programrights':
                return ProgMaintComponent;
            case "worklist":
                return WorklistEntryComponent;
            case "salesorders":
                return OrderentryComponent;
            case "itemmaint":
                return ItemMaintComponent;
        }
        return '';
    }
}