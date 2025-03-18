// // type Registered<T> = T & { __registered: true };

// // type ExtractRegistered<T> = {
// //   [K in keyof T as T[K] extends infer U
// //     ? U extends { __registered: true }
// //       ? K
// //       : never
// //     : never]: T[K] extends infer U
// //     ? U extends { __registered: true }
// //       ? U extends Registered<infer V>
// //         ? V
// //         : never
// //       : never
// //     : never;
// // };

// // function $register<T>(value: T): Registered<T> {
// //   return value as Registered<T>;
// // }

// // // The "end" function -  Crucially, it takes a generic object type.
// // function $end<T extends object>(obj: T): T {
// //   return obj; // Runtime: just return the object.
// // }

// // // function captureEnvironment<
// // // T extends (...args: any[]) => any,
// // // >(closure: T): Parameters<Parameters<T>["at"]>
// // // // ExtractRegistered<Parameters<Parameters<T>["at"]>[0]> { // <- The key change is here!
// // // return undefined as any;
// // // }

// // // --- Example Usage ---

// // const foo = "hi";

// // const result = captureEnvironment(() => {
// // console.log(foo);
// // const another = $register(2);
// // const unregistered = 42;
// //   const nestedObj = {
// //       nested1: $register("abc")
// //   }

// //   $register("another");

// // // Call $end *at the end* of the closure, passing an object
// // // containing the registered variables.
// // $end({ foo, another, unregistered, nestedObj }); // No return!
// // });

// // type Foo = string;

// // type Foo = number;

// // class Context<T extends any[] = []> {
// //   private data: T;

// //   private constructor(...initialData: T) {
// //       this.data = initialData;
// //   }

// //   // Public static factory method
// //   static create<T extends any[] = []>(...initialData: T): ContextProxy<T> {
// //       const context = new Context(...initialData);
// //       return Context.createProxy(context) as ContextProxy<T>;
// //   }

// //   private static createProxy<T extends any[]>(context: Context<T>): Context<T> {
// //       return new Proxy(context, {
// //           get(target, prop, receiver) {
// //               if (prop === 'add') {
// //                   return <U>(item: U): ContextProxy<[...T, U]> => {
// //                       const newData = [...target.data, item] as [...T, U];
// //                       const newContext = new Context(...newData);
// //                       return Context.createProxy(newContext) as ContextProxy<[...T, U]>;
// //                   };
// //               }
// //               return Reflect.get(target, prop, receiver);
// //           },
// //       });
// //   }

// //   getData(): T {
// //       return this.data;
// //   }
// // }

// // //Helper type
// // type ContextProxy<T extends any[]> = Context<T> & {
// // add<U>(item: U): ContextProxy<[...T, U]>;
// // };

// // // --- Usage ---

// // const context = Context.create(); // Type: ContextProxy<[]>
// // context.add('something');       // Type: ContextProxy<[string]>
// // context.add(1);                 // Type: ContextProxy<[string, number]>
// // context.add(true);             // Type: ContextProxy<[string, number, boolean]>

// // const data = context.getData(); // Type: [string, number, boolean]
// // console.log(data); // Output: ["something", 1, true]

// interface Context<T extends any[]> {
//   add: <V>(value: V) => asserts this is NarrowContext<Context<[...typeof this, V]>>;
//   getValues: () => T;
// }

// // function createContext(): Context<[]> {
// //   // const values: any[] = [];
// //   // return {
// //   //     add: function<V>(value: V) {
// //   //         (values as any[]).push(value);
// //   //         (this as any) = new Proxy(this, {
// //   //             get(target, prop) {
// //   //                 if (prop === 'getValues') return () => [...values];
// //   //                 return target[prop as keyof typeof target];
// //   //             }
// //   //         });
// //   //     },
// //   //     getValues: () => values as []
// //   // };
// //   const values: unknown[] = [];
// //   return {
// //       add: function<V>(this: Context<any[]>, value: V) {
// //           values.push(value);
// //       } as any,
// //       getValues: () => values as any
// //   };
// // }

// const another = 'hi';

// // Usage:
// // const context: Context<[]> = createContext();
// const context: Context<[]> = {} as any;
// context.add('something');  // Now knows it's [string]
// context.add(42);          // Now knows it's [string, number]
// context.add('another');

// type NarrowContext<T> = T extends Context<infer U> ? Context<U> : never;

// type Output = NarrowContext<typeof context>

// console.log(context.getValues()); // ['something', 42]

// interface MountContext<T extends any[]> {
//   add: <S>(value: S) => MountContext<[...T, S]>;
//   mount: <R>(fn: () => R) => {
//     values: T;
//   } & (R extends void ? {} : { result: R });
// }

// const something = 'something';
// const someNumber = 42;

// const mountContext = ({} as MountContext<[]>).add(something).add(someNumber);

// const { values: [somethingBrowser, someNumberBrowser ]} = mountContext.mount(() => {
//   console.log(something);
//   console.log(someNumber);
//   // This is not declared, will error on the Babel side
//   console.log(another);
// });

