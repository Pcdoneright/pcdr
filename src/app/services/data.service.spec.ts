import { TestBed, inject } from '@angular/core/testing';

import { DataSvcService } from './data-svc.service';

describe('DataSvcService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataSvcService]
    });
  });

  it('should ...', inject([DataSvcService], (service: DataSvcService) => {
    expect(service).toBeTruthy();
  }));
});
