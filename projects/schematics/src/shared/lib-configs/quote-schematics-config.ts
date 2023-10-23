/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CART_BASE_FEATURE_NAME,
  QUOTE_FEATURE_NAME,
  SPARTACUS_QUOTE,
  SPARTACUS_QUOTE_AWARE,
  SPARTACUS_QUOTE_ASSETS,
  SPARTACUS_QUOTE_ROOT,
  SPARTACUS_QUOTE_REQUEST,
} from '../libs-constants';
import { SchematicConfig } from '../utils';

export const QUOTE_FOLDER_NAME = 'quote';
export const QUOTE_MODULE_NAME = 'Quote';

export const QUOTE_FEATURE_NAME_CONSTANT = 'QUOTE_FEATURE';
export const QUOTE_FEATURE_AWARE_NAME_CONSTANT = 'QUOTE_AWARE_FEATURE';
export const QUOTE_FEATURE_REQUEST_NAME_CONSTANT = 'QUOTE_REQUEST_FEATURE';
export const QUOTE_MODULE = 'QuoteModule';
export const QUOTE_AWARE_MODULE = 'QuoteAwareComponentModule';
export const QUOTE_REQUEST_MODULE = 'QuoteRequestButtonModule';
export const QUOTE_ROOT_MODULE = 'QuoteRootModule';
export const QUOTE_TRANSLATIONS = 'quoteTranslations';
export const QUOTE_TRANSLATION_CHUNKS_CONFIG = 'quoteTranslationChunksConfig';
export const QUOTE_SCSS_FILE_NAME = 'quote.scss';

export const QUOTE_SCHEMATICS_CONFIG: SchematicConfig = {
  library: {
    featureName: QUOTE_FEATURE_NAME,
    mainScope: SPARTACUS_QUOTE,
  },
  folderName: QUOTE_FOLDER_NAME,
  moduleName: QUOTE_MODULE_NAME,
  featureModule: [
    {
      name: QUOTE_MODULE,
      importPath: SPARTACUS_QUOTE,
    },
    {
      name: QUOTE_AWARE_MODULE,
      importPath: SPARTACUS_QUOTE_AWARE,
    },
    {
      name: QUOTE_REQUEST_MODULE,
      importPath: SPARTACUS_QUOTE_REQUEST,
    },
  ],
  rootModule: {
    name: QUOTE_ROOT_MODULE,
    importPath: SPARTACUS_QUOTE_ROOT,
  },
  lazyLoadingChunk: {
    moduleSpecifier: SPARTACUS_QUOTE_ROOT,
    namedImports: [
      QUOTE_FEATURE_NAME_CONSTANT,
      QUOTE_FEATURE_AWARE_NAME_CONSTANT,
      QUOTE_FEATURE_REQUEST_NAME_CONSTANT,
    ],
  },
  styles: {
    scssFileName: QUOTE_SCSS_FILE_NAME,
    importStyle: SPARTACUS_QUOTE,
  },
  i18n: {
    resources: QUOTE_TRANSLATIONS,
    chunks: QUOTE_TRANSLATION_CHUNKS_CONFIG,
    importPath: SPARTACUS_QUOTE_ASSETS,
  },
  dependencyFeatures: [CART_BASE_FEATURE_NAME],
};
