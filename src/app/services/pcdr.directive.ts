import { Directive, Output, EventEmitter } from '@angular/core';

@Directive({
    selector: '[pcdrUpperCase]',
    host: {
        "(input)": 'onInputChange($event)'
    }
})
export class UppercaseDirective {
    @Output() ngModelChange: EventEmitter<any> = new EventEmitter();

    constructor() {}

    onInputChange($event){
        this.ngModelChange.emit($event.target.value.toUpperCase());
    }
}