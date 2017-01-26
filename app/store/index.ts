import { Map, fromJS } from "immutable"
import {
    Store,
    Reducer,
    ReducersMapObject,
    applyMiddleware,
    createStore
} from "redux"
import { History } from "history"
import { ApolloClient } from "apollo-client"
import { combineReducers } from "redux-immutable"
import thunkMiddleware from "redux-thunk"
import { routerMiddleware } from "react-router-redux"
import { autoRehydrate } from "redux-persist"
import { REHYDRATE } from "redux-persist/constants"
import createActionBuffer from "redux-action-buffer"
import arrayMiddleware from "./middlewares/array"
import reducersRegistry, { State } from "./reducers"
import { composeWithDevTools, NORMALIZE_STATE } from "./util"
import { isBrowser, isDevEnv } from "../lib/util"

export const records = []

export { State }

export interface EnhancedStore extends Store<State> {
    injectReducers(nextReducersRegistry: ReducersMapObject): void
}

const preloadedState: State | void = !isBrowser ? void(0) :
    fromJS(JSON.parse(
        localStorage.getItem("state")) ||
            window["__PRELOADED_STATE__"])

export default function configureStore({ history, client }: {
    history: History,
    client: ApolloClient
}): EnhancedStore {
    const middlewares = [
        thunkMiddleware,
        arrayMiddleware,
        client.middleware(),
        routerMiddleware(history),
        createActionBuffer(REHYDRATE)
    ]

    const apolloReducer = client.reducer() as Reducer<any>
    reducersRegistry["apollo"] = apolloReducer
    const reducer = combineReducers(reducersRegistry)

    const finalCreateStore = composeWithDevTools(
        applyMiddleware(...middlewares),
        autoRehydrate({ log: isDevEnv })
    )(createStore)

    const store: EnhancedStore = finalCreateStore(
        reducer, preloadedState)

    // Fix Immutable types
    store.dispatch({ type: NORMALIZE_STATE })

    store.injectReducers = nextReducersRegistry => {
        const finalReducersRegistry = Object.assign(
            reducersRegistry,
            nextReducersRegistry)
        const nextReducer = combineReducers(finalReducersRegistry)
        store.replaceReducer(reducer)
    }

    const { hot } = module as any
    if (hot) hot.accept("./reducers", () => {
        const {default: nextReducersRegistry} = require("./reducers")
        store.injectReducers(nextReducersRegistry)
    })

    return store
}
