import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import { I18nTestingModule, Price } from '@spartacus/core';
import {
  Quote,
  QuoteActionType,
  QuoteDiscount,
  QuoteDiscountType,
  QuoteFacade,
  QuoteMetadata,
  QuoteState,
} from '@spartacus/quote/root';

import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';

import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  ReactiveFormsModule,
  UntypedFormControl,
} from '@angular/forms';
import { ICON_TYPE } from '@spartacus/storefront';
import {
  createEmptyQuote,
  EXPIRATION_DATE_AS_STRING,
  EXPIRATION_TIME_AS_STRING,
  QUOTE_CODE,
} from '../../../core/testing/quote-test-utils';
import { QuoteUIConfig } from '../../config';
import { QuoteHeaderSellerEditComponent } from './quote-header-seller-edit.component';
import { QuoteHeaderSellerEditComponentService } from './quote-header-seller-edit.component.service';
import createSpy = jasmine.createSpy;

const mockCartId = '1234';
const threshold = 20;
const totalPrice: Price = { value: threshold + 1 };
const invalidInput = 'INVALID';
const DEBOUNCE_TIME = 1000;
const DEFAULT_DEBOUNCE_TIME = 500;

const mockQuote: Quote = {
  ...createEmptyQuote(),
  allowedActions: [
    { type: QuoteActionType.EDIT, isPrimary: false },
    { type: QuoteActionType.REQUOTE, isPrimary: true },
  ],
  state: QuoteState.SELLER_DRAFT,
  cartId: mockCartId,
  code: QUOTE_CODE,
  threshold: threshold,
  totalPrice: totalPrice,
  expirationTime: new Date(EXPIRATION_TIME_AS_STRING),
};

const mockQuoteDetails$ = new BehaviorSubject<Quote>(mockQuote);
const formatter = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
});

let uiConfig: QuoteUIConfig;

class MockCommerceQuotesFacade implements Partial<QuoteFacade> {
  getQuoteDetails(): Observable<Quote> {
    return mockQuoteDetails$.asObservable();
  }
  addDiscount = createSpy();
  editQuote = createSpy();
}

class MockQuoteHeaderSellerEditComponentService {
  parseDiscountValue() {
    return of(0);
  }
  getFormatter() {
    return of(formatter);
  }
  getLocalizationElements() {
    return of({
      locale: 'en',
      currencySymbol: '$',
      formatter: formatter,
    });
  }
  getNumberFormatValidator() {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return control.value === invalidInput ? { wrongFormat: {} } : null;
    };
  }
  isEditable(): boolean {
    return true;
  }
  addTimeToDate(): string {
    return EXPIRATION_TIME_AS_STRING;
  }
  removeTimeFromDate(): string {
    return EXPIRATION_DATE_AS_STRING;
  }
  getMaximumNumberOfTotalPlaces(): number {
    return 10;
  }
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'cx-date-picker',
  template: '',
})
class MockDatePickerComponent {
  @Input() control: UntypedFormControl;
  @Input() min: UntypedFormControl;
  @Input() max: UntypedFormControl;
  @Input() required: boolean;
}

@Component({
  selector: 'cx-icon',
  template: '',
})
class MockCxIconComponent {
  @Input() type: ICON_TYPE;
}

describe('QuoteHeaderSellerEditComponent', () => {
  let fixture: ComponentFixture<QuoteHeaderSellerEditComponent>;
  let component: QuoteHeaderSellerEditComponent;
  let quoteFacade: QuoteFacade;

  beforeEach(() => {
    uiConfig = {
      quote: { updateDebounceTime: { expiryDate: DEBOUNCE_TIME } },
    };
    TestBed.configureTestingModule({
      imports: [I18nTestingModule, ReactiveFormsModule],
      declarations: [
        QuoteHeaderSellerEditComponent,
        MockCxIconComponent,
        MockDatePickerComponent,
      ],
      providers: [
        {
          provide: QuoteFacade,
          useClass: MockCommerceQuotesFacade,
        },
        {
          provide: QuoteHeaderSellerEditComponentService,
          useClass: MockQuoteHeaderSellerEditComponentService,
        },
        {
          provide: QuoteUIConfig,
          useValue: uiConfig,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuoteHeaderSellerEditComponent);
    component = fixture.componentInstance;
    quoteFacade = TestBed.inject(QuoteFacade);
    mockQuote.quoteDiscounts = {};
    mockQuoteDetails$.next(mockQuote);
  });

  it('should create component', () => {
    expect(component).toBeDefined();
    expect(quoteFacade).toBeDefined();
  });

  it('should emit data for in case seller status is provided', (done) => {
    component.quoteDetailsForSeller$
      .subscribe((quote) => {
        expect(quote.code).toBe(QUOTE_CODE);
        done();
      })
      .unsubscribe();
  });

  it('should unsubscribe subscription on ngOnDestroy', () => {
    const spyUnsubscribe = spyOn(Subscription.prototype, 'unsubscribe');
    component.ngOnDestroy();
    expect(spyUnsubscribe).toHaveBeenCalled();
  });

  describe('ngOnInit', () => {
    it('should provide initial value for discount control', () => {
      fixture.detectChanges();
      expect(component.form.controls.discount.value).toBe(null);
    });

    it('should provide formatted value for discount control in case a discount exists', () => {
      mockQuote.quoteDiscounts = { value: 1 };
      fixture.detectChanges();
      expect(component.form.controls.discount.value).toBe('$1.00');
    });

    it('should provide initial value for expiry date control', () => {
      fixture.detectChanges();
      expect(component.form.controls.validityDate.value).toBe(
        EXPIRATION_DATE_AS_STRING
      );
    });
  });

  describe('field validation', () => {
    it('should detect that invalid input is not desired', () => {
      fixture.detectChanges();
      component.form.controls.discount.setValue(invalidInput);
      fixture.detectChanges();
      expect(component.form.controls.discount.valid).toBe(false);
    });

    it('should accept valid input', () => {
      fixture.detectChanges();
      component.form.controls.discount.setValue('1234');
      fixture.detectChanges();
      expect(component.form.controls.discount.valid).toBe(true);
    });
  });

  describe('onApply', () => {
    it('should call corresponding facade method', () => {
      component.form.controls.discount.setValue(0);
      const expectedDiscount: QuoteDiscount = {
        discountRate: component.form.controls.discount.value,
        discountType: QuoteDiscountType.ABSOLUTE,
      };
      component.onApply(QUOTE_CODE);
      expect(quoteFacade.addDiscount).toHaveBeenCalledWith(
        QUOTE_CODE,
        expectedDiscount
      );
    });
  });

  describe('onSetDate', () => {
    it('should call corresponding facade method after default debounce time', fakeAsync(() => {
      const expectedQuoteMetaData: QuoteMetadata = {
        expirationTime: EXPIRATION_TIME_AS_STRING,
      };
      (uiConfig.quote ?? {}).updateDebounceTime = undefined;
      component.ngOnInit();
      component.onSetDate(QUOTE_CODE);
      expect(quoteFacade.editQuote).not.toHaveBeenCalled();
      tick(DEFAULT_DEBOUNCE_TIME);
      expect(quoteFacade.editQuote).toHaveBeenCalledWith(
        QUOTE_CODE,
        expectedQuoteMetaData
      );
    }));

    it('should call corresponding facade method after configured debounce time', fakeAsync(() => {
      const expectedQuoteMetaData: QuoteMetadata = {
        expirationTime: EXPIRATION_TIME_AS_STRING,
      };
      component.ngOnInit();
      component.onSetDate('INVALID');
      tick(DEFAULT_DEBOUNCE_TIME);
      component.onSetDate(QUOTE_CODE);
      expect(quoteFacade.editQuote).not.toHaveBeenCalled();
      tick(DEBOUNCE_TIME);
      expect(quoteFacade.editQuote).toHaveBeenCalledWith(
        QUOTE_CODE,
        expectedQuoteMetaData
      );
    }));
  });

  describe('mustDisplayValidationMessage', () => {
    it('should return false for valid input', () => {
      expect(component.mustDisplayValidationMessage()).toBe(false);
    });

    it('should return true in case validation errors exist', () => {
      component.form.controls.discount.setErrors([{}]);
      expect(component.mustDisplayValidationMessage()).toBe(true);
    });
  });
});
