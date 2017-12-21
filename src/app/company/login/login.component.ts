import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'toastr-ng2';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
	userid: string;
	password: string;
	//model = {userid:'test', password:'123'};

	constructor(private router: Router, private toastr: ToastrService, protected DataSvc: DataService, public sharedSrvc: SharedService) { }

	ngOnInit() {
		this.DataSvc.serverDataGet('api/Company/GetCompanyName').subscribe((data) => {
			this.sharedSrvc.companyName = data;
			this.sharedSrvc.ofHourGlass(false);
		});
	}

	onSubmit() {
		// console.log('submit');
		// console.log(this.model.userid);

		this.sharedSrvc.ofHourGlass(true);
		this.DataSvc.serverDataGet('api/Login/GetLogin', {
            userid: this.userid,
            pswd: this.password
        }).subscribe((dataResponse) => {
			if (dataResponse.success) {
                this.sharedSrvc.menu = dataResponse.data;
				this.sharedSrvc.user = dataResponse.user;
				this.router.navigateByUrl('/mainmenu');
            }
            else
                this.toastr.error('Invalid User ID or Password.');
			
			this.sharedSrvc.ofHourGlass(false);
		});
	}

}
