import { Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class SharedService {
	public loaderStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	// public viewRefObs: BehaviorSubject<ViewContainerRef> = new BehaviorSubject<ViewContainerRef>(null);
	public viewRefObs = new BehaviorSubject<ViewContainerRef>(null);
	public user: any;
	public companyName: string;
	public companyVersion: string = 'V3.0.4';
	menu = [];

	constructor() { }

	ofHourGlass(pVal: boolean) {
		this.loaderStatus.next(pVal);
	}

	ofSendViewContainerRef(viewRef) {
		try {
		this.viewRefObs.next(viewRef);
	}
	catch(err) {
		console.log('error on next');
	}
		//setTimeout(() => this.viewRefObs.complete(), 500);
	}
}
