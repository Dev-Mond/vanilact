export type Route = {
    path: string;
    component: any,
    alias?: string,
    middlewares?: CallableFunction[];
};

export type Component = {
    willMount?: () => void,
    render: () => any,
    onMount?: () => void,
    setDom?: ( dom: HTMLElement | Node | null ) => void;
};

export type statusCodeComp = {
    code: number | string,
    component: any;
    params?: { [ k: string ]: any; };
};

export type Reference = {
    current: any;
};
