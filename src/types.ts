export type Route = {
    path: string
    component: any,
    alias?: string,
    middlewares?: CallableFunction[]
}

export type Component = {
    willMount?: () => void,
    render: () => any,
    onMount?: () => void,
}