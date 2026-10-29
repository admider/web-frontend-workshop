/* ================================================================
   state.js · 全局状态管理
   ================================================================ */

/**
 * 应用全局状态
 * 每个模块的状态独立存放，避免互相干扰
 */
export const appState = {
    boxmodel: {
        contentWidth: 120,
        padding: 30,
        border: 4,
        margin: 30,
        boxSizing: false,
        demoStep: 0,
        demoTimer: null,
        playing: false,
        currentChallenge: 0
    },
    float: {
        floats: { a: 'none', b: 'none', c: 'none' },
        step: 0,
        playing: false,
        timer: null
    }
};

/**
 * 重置指定模块的状态
 * @param {string} moduleName
 */
export function resetModuleState(moduleName) {
    if (moduleName === 'boxmodel') {
        Object.assign(appState.boxmodel, {
            contentWidth: 120,
            padding: 30,
            border: 4,
            margin: 30,
            boxSizing: false,
            demoStep: 0,
            playing: false,
            currentChallenge: 0
        });
        if (appState.boxmodel.demoTimer) {
            clearInterval(appState.boxmodel.demoTimer);
            appState.boxmodel.demoTimer = null;
        }
    }
    if (moduleName === 'float') {
        Object.assign(appState.float, {
            floats: { a: 'none', b: 'none', c: 'none' },
            step: 0,
            playing: false
        });
        if (appState.float.timer) {
            clearInterval(appState.float.timer);
            appState.float.timer = null;
        }
    }
}