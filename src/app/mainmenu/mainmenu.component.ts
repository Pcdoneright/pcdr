import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { CustomModule } from '../appcustom.module';

@Component({
	selector: 'main-menu',
	templateUrl: './mainmenu.component.html',
	styleUrls: ['./mainmenu.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class MainMenuComponent implements OnInit {
    public sideNavClassToggled: boolean = false;
    fname: string;
    menus = [];
    menuCurrentIndex:number = -1;
    tabs = [];
    //currentTabTitle:string;
    selectedIndex:number = 0; // Tabs

    constructor(private customModule: CustomModule, public sharedSrvc: SharedService) {}

	ngOnInit() {
        this.fname = this.sharedSrvc.user['fname'];
        this.createMenu(this.sharedSrvc.menu);
    }

    onSideNavToggle() {
        this.sideNavClassToggled = !this.sideNavClassToggled;
        setTimeout(()=> $(window).trigger('resize'), 100); // Trigger event registered on the components in tabs TODO: find a way to work without Jquery
    }

    addTab(submenu) {
        // If found select it
        for (var j = 0; j < this.tabs.length; j++) {
            if (submenu.id == this.tabs[j].id) {
                //this.currentTabTitle = submenu.prog;
                this.selectedIndex = j; // Bring tab to front
                return;
            }
        }
        // console.log('stil addTab');

        this.tabs.push({title: submenu.prog, content: submenu.path, id:submenu.id, active: true});
        //this.currentTabTitle = submenu.prog;
        
        // Create Component but only subscribe once
        // if (!this._subsribed) {
            // setTimeout(() => {
                // this.sharedSrvc.viewRefObs.subscribe((viewRef: ViewContainerRef) => {
                //     console.log('creating component: ' + submenu.id);
                //     const factory = this.componentFactoryResolver.resolveComponentFactory(this.customModule.ofGetComponent(submenu.id));
                //     viewRef.createComponent(factory);

                    // this.tabset.select(submenu.id);
                    // console.log('retsub', retsub);
                    // setTimeout(() => {this.sharedSrvc.viewRefObs.unsubscribe()}, 100);

                    //this.sharedSrvc.viewRefObs.unsubscribe();
                    // console.log(temp1);
                // });
                // this.mTabset.selectedIndex = this.tabs.length - 1;
                
                // console.log('tab->', this.tabs.length - 1);
                this.selectedIndex = this.tabs.length - 1;
            // }, 500);
        // }
            
        // var html :HTMLElement = this.elementRef.nativeElement;
        // var html :HTMLElement = this.tabElement.element.nativeElement;
        //console.log('querySelector->', html.querySelector("#c-" + submenu.id));
        // console.log(this.elementRef.nativeElement.select("#c-" + submenu.id));
        // console.log(this.viewContainerRef);
        // console.log('tabElement', this.tabElement.element.nativeElement);

        // console.log(html.querySelector("#c-" + submenu.id));

        // const ref = this.viewContainerRef.createComponent(factory);
        //const ref = html.querySelector("#c-" + submenu.id).insertBefore(factory);
        //const ref = this.tabElement.createComponent(factory);
        //ref.changeDetectorRef.detectChanges();

        
        // setTimeout(() => {this.selectedIndex = this.tabs.length - 1}, 500); // Bring tab to front
        
        //this.elementRef.nativeElement.select("#c-" + submenu.id)
        //console.log(this.tabset);
        
    }

    ofGetComponent(cName: string) {
        return this.customModule.ofGetComponent(cName);
    }

    removeTab(tab) {
        for (var j = 0; j < this.tabs.length; j++) {
            if (tab.title == this.tabs[j].title) {
                // if (this.tabs[j].hasOwnProperty('controller')) {
                //     this.tabs[j]['controller'].unload(); // call unload function
                // }
                this.tabs.splice(j, 1);
                this.selectedIndex--;
                //this.currentTabTitle = (j > 0)? this.tabs[j-1].title: ''; // Refresh title
                break;
            }
        }
    }

    createMenu(pMenu) {
        var mMmindex = 0;
        var mPrevGroup = '';

        for (var i in pMenu) {
            // Create group
            if (mPrevGroup !== pMenu[i].groupname) {
                mMmindex++; // Increment when new group
                this.menus.push({"groupname": pMenu[i].groupname, "index": mMmindex, "submenu": []});
            }
            // Create sub group
            this.menus[mMmindex - 1].submenu.push({
                path: 'app/' + pMenu[i].fwindow + '/' + pMenu[i].id + '.html',
                index: mMmindex,
                prog: pMenu[i].text,
                id: pMenu[i].id,
                fadmin: pMenu[i].fadmin,
                fupdate: pMenu[i].fupdate
            });
            mPrevGroup = pMenu[i].groupname;
        }
        //console.log(this.menus);
    }

    // Expand Menu
    toggleSelectSection(section) {
        if (this.menuCurrentIndex == section) section = -1; // Disable All if active
        this.menuCurrentIndex = section;
    }

    isSectionSelected(index) {
        return (this.menuCurrentIndex === index);
    }
}