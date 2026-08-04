/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { AppRegistry } from 'react-native';
import { AutoLogging, setCurrentScreen } from 'hyperion-react-native';
import { AUTO_LOGGING_CONFIG } from './AutoLoggingConfig';
import './EventStore';
import { name as appName } from './app.json';

AutoLogging.init(AUTO_LOGGING_CONFIG);
setCurrentScreen('fixture_home', { source: 'bootstrap' });

const App = require('./App').default;
AppRegistry.registerComponent(appName, () => App);
