import { TestBed } from '@angular/core/testing';

import { DmTableService } from './dm-table.service';

describe('DmTableService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DmTableService = TestBed.get(DmTableService);
    expect(service).toBeTruthy();
  });
});
