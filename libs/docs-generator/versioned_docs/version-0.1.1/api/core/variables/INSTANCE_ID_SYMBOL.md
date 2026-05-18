# Variable: INSTANCE_ID_SYMBOL

<div class="api-package">Imported from <code>@react-logic/core</code></div>


<div class="api-signature">

> `const` **INSTANCE\_ID\_SYMBOL**: *typeof* `INSTANCE_ID_SYMBOL`

</div>

<div class="api-sources">

Defined in: [core/src/lib/use.logic.ts:17](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/core/src/lib/use.logic.ts#L17)

</div>

Symbol attached by `useLogic` to every constructed logic instance, holding
a monotonic per-process id. Useful for correlating debug logs across the
lifetime of an instance (constructor, signal updates, cleanup) since the
class itself doesn't otherwise carry an identity for the same render.

Treat as read-only. Not part of stable user API; exposed for debugging.
