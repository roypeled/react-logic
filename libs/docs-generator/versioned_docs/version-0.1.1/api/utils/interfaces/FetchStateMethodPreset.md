# Interface: FetchStateMethodPreset()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:585](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L585)

</div>

Shape of a verb-preset helper — same as `fetchState`.

<div class="api-signature">

> **FetchStateMethodPreset**\<`F`, `T`\>(`build`, `config?`): `ReactiveReturn`\<`F`, `T`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:586](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L586)

</div>

Shape of a verb-preset helper — same as `fetchState`.

## Type Parameters

### F

`F` *extends* (...`args`) => [`FetchStateBuilderResult`](../type-aliases/FetchStateBuilderResult.md)\<`T`\>

### T

`T` = `unknown`

## Parameters

<div class="api-parameters">

### build

`F`

### config?

[`FetchStateConfig`](FetchStateConfig.md)\<`T`\>

</div>

## Returns

`ReactiveReturn`\<`F`, `T`\>

## Properties

### callable

<div class="api-signature">

> **callable**: \<`Args`, `T`\>(`build`, `config?`) => [`FetchStateAccessor`](../type-aliases/FetchStateAccessor.md)\<`T`, `Args`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:594](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L594)

</div>

#### Type Parameters

##### Args

`Args` *extends* readonly `unknown`[]

##### T

`T` = `unknown`

#### Parameters

<div class="api-parameters">

##### build

(...`args`) => `string` \| [`FetchStateRequest`](FetchStateRequest.md)\<`T`\>

##### config?

[`FetchStateConfig`](FetchStateConfig.md)\<`T`\>

</div>

#### Returns

[`FetchStateAccessor`](../type-aliases/FetchStateAccessor.md)\<`T`, `Args`\>
