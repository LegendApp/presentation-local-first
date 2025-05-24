import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => ({
    ...config,
    ios: {
        infoPlist: {
            NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
            },
        },
    },
});
