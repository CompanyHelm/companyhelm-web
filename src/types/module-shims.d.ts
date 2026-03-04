declare module "react-dom/client" {
  const ReactDOM: any;
  export default ReactDOM;
}

declare module "react-relay" {
  export const RelayEnvironmentProvider: any;
}

declare module "relay-runtime" {
  export const Environment: any;
  export const Network: any;
  export const Observable: any;
  export const QueryResponseCache: any;
  export const RecordSource: any;
  export const Store: any;
}
