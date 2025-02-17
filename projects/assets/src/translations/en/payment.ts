/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export const payment = {
  paymentForm: {
    payment: 'Payment',
    choosePaymentMethod: 'Choose a payment method',
    paymentType: 'Payment Type',
    accountHolderName: {
      label: 'Account Holder Name',
      placeholder: 'Account Holder Name',
    },
    cardNumber: 'Card Number',
    expirationDate: 'Expiration Date',
    securityCode: 'Security code (CVV)',
    securityCodeTitle: 'Card Verification Value',
    saveAsDefault: 'Save as default',
    setAsDefault: 'Set as default payment method',
    billingAddress: 'Billing address',
    sameAsDeliveryAddress: 'Same as delivery address',
    billingAddressSameAsShipping:
      'Billing address is the same as delivery address',
    selectOne: 'Select One...',
    monthMask: 'MM',
    yearMask: 'YYYY',
    expirationYear: 'Expiration year {{ selected }}',
    expirationMonth: 'Expiration month {{ selected }}',
    useThisPayment: 'Use this payment',
    addNewPayment: 'Add New Payment',
    paymentAddedSuccessfully: 'New payment was added successfully',
    changePayment: 'Change Payment',
  },
  paymentMethods: {
    paymentMethods: 'Payment methods',
    paymentMethodSelected: 'Payment method selected',
    newPaymentMethodsAreAddedDuringCheckout:
      'New payment methods are added during checkout.',
    invalidField: 'InvalidField: {{ field }}',
  },
  paymentCard: {
    deleteConfirmation: 'Are you sure you want to delete this payment method?',
    setAsDefault: 'Set as default',
    expires: 'Expires: {{ month }}/{{ year }}',
    defaultPaymentMethod: '✓ DEFAULT',
    defaultPaymentLabel: 'Default payment method',
    additionalPaymentLabel: 'Additional payment method {{ number }}',
    selected: 'Selected',
    deletePaymentSuccess: 'Payment method deleted successfully',
  },
  paymentTypes: {
    title: 'Payment method',
    paymentType_CARD: 'Credit Card',
    paymentType_ACCOUNT: 'Account',
  },
  paymentMessages: {
    setAsDefaultSuccessfully: 'New payment was successfully set as default',
  },
};
