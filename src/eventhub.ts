type EventMap = Record<string, unknown>;
type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface IEventHub<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  trigger<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

export default class EventHub<T extends EventMap> implements IEventHub<T> {
  private readonly eventTarget;

  constructor() {
    this.eventTarget = new EventTarget();
  }

  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    this.eventTarget.addEventListener(eventName, (e) => this.customEventFunctionWrapper(fn, (e as CustomEvent<T[K]>).detail));
  }

  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    this.eventTarget.removeEventListener(eventName, (e) => this.customEventFunctionWrapper(fn, (e as CustomEvent<T[K]>).detail));
  }

  trigger<K extends EventKey<T>>(eventName: K, params?: T[K]) {
    this.eventTarget.dispatchEvent(new CustomEvent(eventName, { detail: params }));
  }

  private customEventFunctionWrapper<K extends EventKey<T>>(fn: EventReceiver<T[K]>, params: T[K]) {
    fn(params);
  }
}