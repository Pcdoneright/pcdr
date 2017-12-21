import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { URLSearchParams } from '@angular/http';
import { HttpClient, HttpParams } from '@angular/common/http';
// import 'rxjs/add/operator/map';
import { ToastrService } from 'toastr-ng2';
import { Observable } from 'rxjs/Observable';
import { SharedService } from '../services/shared.service';

//--------------------------------
// SINGLE INSTANCE
//--------------------------------
@Injectable()
export class DataService {
	constructor(private http: HttpClient, private datePipe: DatePipe, private toastr: ToastrService, private sharedSrvc: SharedService) {
	    // console.log('DataService -> constructor()');
    }

	serverDataGet(pUrl, pParms?, pConvert = true) : Observable<any> {
		// Create proper parameters
		// let params: URLSearchParams = new URLSearchParams();
		let params = new HttpParams();
		if (pParms) {
			// Before sending to server convert date(only not datetime) to string to have current values instead of zulu
			this.convertDateDatesToString(pParms);

			for (var key in pParms) {
				if (!pParms.hasOwnProperty(key)) continue;
				params = params.set(key, pParms[key]);
			}
		}

		return Observable.create(observer => {
			// console.log('params->', params);
			// this.http.get(pUrl, { search: params })
			this.http.get(pUrl, { params: params })
				// .map((res) => res.json())
				.subscribe(
				data => {
					//console.log('serverdataget', data);
					// Before receiving date from server convert string to date
					if (pConvert) this.convertStringToDate(data);
					observer.next(data);
				},
				err => {
					this.toastr.error('error from server using: ' + err);
					console.log('error', err);
					this.sharedSrvc.ofHourGlass(false);
				},
                () => observer.complete()) // This will trigger finally()
		});
	}

	// Return a promise
	serverDataPost(pUrl, pData, pParms = []) : Observable<any> {
		// Before sending to server convert date(only not datetime) to string to have current values instead of zulu
		this.convertDateDatesToString(pData);

		return Observable.create(observer => {
			// debugger;
			// this.http.post(pUrl, {params: pParms, data: pData}).subscribe(
			// TODO: Check for Parameter passing
			this.http.post(pUrl, pData).subscribe(
				data => {
					// observer.next(JSON.parse(data['_body']));
					observer.next(data);
				},
				err => {
					this.toastr.error('error from server using: ' + err);
					console.log('error', err);
					this.sharedSrvc.ofHourGlass(false);
				})
			});

			// this.$http({
			// 	method: 'POST',
			// 	url: pUrl,
			// 	params: pParms,
			// 	data: pData
			// }).success((data) => {
			// 	deferred.resolve(data);
			// }).error(() => {
			// 	deferred.reject("error from server using: " + pUrl); // Send Back Unhandled Server Error
			// 	this.toastr.error("error from server using: " + pUrl); // Show toastr with error
			// 	this.$rootScope.hourGlassLoading = false; // Re-enable access
			// });
		// });
	};

	// Convert Date to String before it gets send to server
	convertDateDatesToString(input) {
		// Ignore things that aren't objects.
		if (typeof input !== "object") return input;

		for (var key in input) {
			if (!input.hasOwnProperty(key)) continue;

			var value = input[key];
			if (typeof value === 'string' || value === null) continue; // Exit for non-objects

			// Check for object properties which look like dates.
			//if (typeof value === 'object' && Object.getPrototypeOf(value).toString() === "Invalid Date") {
			if (typeof value === 'object' && Object.prototype.toString.call(value) === '[object Date]') {
				// Convert only date with zero time (getHours() always show a number)
				if (value.getMinutes() + value.getSeconds() === 0) {
					// input[key] = this.$filter('date')(value, 'yyyy-MM-dd 00:00:00'); // Covert to String for proper datetime
					input[key] = this.datePipe.transform(value, 'yyyy-MM-dd 00:00:00'); // Covert to String for proper datetime
					//console.log(input[key]);
				}
				else {
					// input[key] = this.$filter('date')(value, 'yyyy-MM-dd HH:mm:ss'); // Covert to String to non-zulu 24hrs datetime
					input[key] = this.datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss'); // Covert to String to non-zulu 24hrs datetime
				}
			} else if (typeof value === "object") {
				// Recurse into object
				this.convertDateDatesToString(value);
			}
		}
	}

	regexIso8601 = /^(\d{4})-0?(\d+)-0?(\d+)[T ]0?(\d+):0?(\d+):0?(\d+)Z?/;
	// Convert String to Date object
	convertStringToDate(input) {
		// Ignore things that aren't objects.
		if (typeof input !== "object") return input;

		for (var key in input) {
			if (!input.hasOwnProperty(key)) continue;

			var value = input[key];
			var match;
			// Check for string properties which look like dates.
			if (typeof value === "string" && (match = value.match(this.regexIso8601))) {
				//console.log(value);
				// Use 12 hr o make sure date stays the same for Non-Timestamps
				if (value.slice(-1) !== 'Z') value = value.replace("T00", "T12");
				if (value.slice(-1) !== 'Z') value = value.replace("T", " "); // Preserve Original DateTime When new Date() is applied otherwise converted to Z
				input[key] = new Date(value);
				//console.log(input[key]);
			} else if (typeof value === "object") {
				// Recurse into object
				this.convertStringToDate(value);
			}
		}
	}

}