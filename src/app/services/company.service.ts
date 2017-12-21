import { Injectable } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmDialog } from './confirm-dialog.component';
import { InputDialog } from './dialog-input.component';
import { SharedService } from '../services/shared.service';
import { DataService } from '../services/data.service';
import {isUndefined} from "util";

//--------------------------------
// SINGLE INSTANCE
//--------------------------------
@Injectable()
export class CompanyService {

	constructor(private dialog: MatDialog, private sharedSrvc: SharedService, private datePipe: DatePipe, private currencyPipe: CurrencyPipe, private DataSvc: DataService) {
		console.log('CompanyService -> constructor()');
	}

	ofHourGlass(value: boolean) {
		setTimeout(() => this.sharedSrvc.ofHourGlass(value), 0); // Prevents ng2 error with setTimeout
	}

	confirm(message: string, title = "Confirm", yes = "Yes", no = "No"): Observable<boolean> {
		let dialogRef: MatDialogRef<ConfirmDialog>;

		dialogRef = this.dialog.open(ConfirmDialog, {
			disableClose: true
		});
		dialogRef.componentInstance.title = title;
		dialogRef.componentInstance.message = message;
		dialogRef.componentInstance.yes = yes;
		dialogRef.componentInstance.no = no;

		return dialogRef.afterClosed();
	}

	inputDialog(message: string, value = "", title = "Input Value", yes = "Continue", no = "Cancel"): Observable<boolean> {
		let dialogRef: MatDialogRef<InputDialog>;

		dialogRef = this.dialog.open(InputDialog, {
			disableClose: true
		});
		dialogRef.componentInstance.title = title;
		dialogRef.componentInstance.message = message;
		dialogRef.componentInstance.yes = yes;
		dialogRef.componentInstance.no = no;
		dialogRef.componentInstance.textValue = value;

		return dialogRef.afterClosed();
	}

	// Replaces angular.copy
	deepCopy(oldObj: any) {
		var newObj = oldObj;
		// Not a date object
		if (oldObj && typeof oldObj === "object" && Object.prototype.toString.call(oldObj) !== '[object Date]' ) {
			newObj = Object.prototype.toString.call(oldObj) === "[object Array]" ? [] : {};
			for (var i in oldObj) {
				newObj[i] = this.deepCopy(oldObj[i]);
			}
		}
		return newObj;
	}

    // For Angular-Grid
    dateRenderer(params) {
        if (!params.value) return null;
        var value = params.value;
        if (typeof value === "string") {
            // Use 12 hr o make sure date stays the same for Non-Timestamps
            if (value.slice(-1) !== 'Z') value = value.replace("T00", "T12");
            value = new Date(value);
        }
        return this.datePipe.transform(value, 'MM/dd/yyyy');
    }
    // For Angular-Grid
    phoneRenderer(params) {
        if (!params.value) return null;
        return params.value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    };

    // For Angular-Grid
    currencyRenderer(params) {
        return this.currencyPipe.transform(params.value, 'USD', true); // returns $
    }

    // Return a valid number either float or int
    validNumber(value, decimals?) {
        if (!value) return 0;
        if (!decimals) decimals = 0; // default

        // Convert to number
        var clean = value.replace(/[^0-9\.\-]/g, ''); // Allow negative too
        if (decimals > 0) {
            var decimalCheck = clean.split('.');
            if (!decimalCheck[1] === undefined) {
                decimalCheck[1] = decimalCheck[1].slice(0, decimals); // Get decimal values
                clean = decimalCheck[0] + '.' + decimalCheck[1];
            }
        }
        if (!clean) return 0; // if invalid return 0
        clean = (decimals == 0) ? parseInt(clean, 10) : parseFloat(clean); // float if decimals = 0
        return clean;
    }

    r2d(value) {
        return Math.round(value * 1e2) / 1e2;
    }

    // Create Report Request and send to sender
    ofCreateReport(pDwName, pParameters, pfpriority?:number) {
        var mData = [], mRptH = [], mRptP = [];

        // Create reportheaders
        mRptH.push({fdwname: pDwName, fpriority: (pfpriority) ? pfpriority : 1});
        // Create reportparameters
        pParameters.forEach(function (pValue) {
            mRptP.push(pValue);
        });

        mData.push(['reportheaders', mRptH]);
        mData.push(['reportparameters', mRptP]);

        return Observable.create((observer) => {
            // Send data to server and response will be the filename
            this.DataSvc.serverDataPost('api/Company/PostCreateReport', mData).subscribe((dataResponse) => {
                observer.next(dataResponse);
            });
        });
    }

    // Checks a file from the server but loops every 3 seconds until file exist and calls back function.
    ofCheckServerFile(pUrl, pCallBack) {
        var request = new XMLHttpRequest();

        request.open('HEAD', pUrl, false);
        request.send();

        if (request.status == 200) {
            this.ofHourGlass(false);
            // file exists, call function when done
            if (pCallBack)  setTimeout(() => pCallBack(), 1000);
        } else {
            // call every 3 second
            setTimeout(() => {
                this.ofCheckServerFile(pUrl, pCallBack);
            }, 3000);
        }
    }
}
