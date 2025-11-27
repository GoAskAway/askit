# Askit Upgrade TODO

This document tracks the necessary changes to upgrade `askit` to match the latest `rill` improvements.

## ✅ Completed

### 1. Dependencies Updated
- ✅ React: `^18.2.0` → `^19.2.0`
- ✅ @types/react: `^18.2.0` → `^19.2.7`
- ✅ react-native: `^0.72.0` → `^0.82.1`
- ✅ Removed: `@types/react-native` (RN now provides own types)

### 2. Infrastructure
- ✅ Added `engines` configuration (Node >=18, npm >=9)
- ✅ Added `engineStrict: true`
- ✅ Created GitHub Actions CI pipeline

### 3. TypeScript Configuration
- ✅ Enabled all strict TypeScript checks:
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `noUncheckedIndexedAccess: true`
  - `noPropertyAccessFromIndexSignature: true`
  - And 10+ more strict options

## ⚠️ Pending Type Errors (62 errors)

The strict TypeScript configuration revealed **62 type errors** that need to be fixed:

### Error Categories

#### 1. Index Signature Access (12 errors)
**Pattern**: `Property 'X' comes from an index signature`

**Files affected**:
- `src/api/Bus.remote.test.ts`
- `src/api/Haptic.remote.test.ts`
- `src/api/Toast.remote.test.ts`
- `src/ui/ThemeView/ThemeView.native.tsx`
- `src/ui/UserAvatar/UserAvatar.native.tsx`

**Fix**: Change `obj.property` to `obj['property']`

```typescript
// Before
mockBridge.sendToHost('event', data);

// After
mockBridge['sendToHost']('event', data);
```

#### 2. Possibly Undefined (23 errors)
**Pattern**: `Object is possibly 'undefined'` or `Type 'X | undefined' is not assignable`

**Files affected**:
- All test files
- `src/core/bridge.ts`
- `src/ui/UserAvatar/UserAvatar.native.tsx`
- `src/ui/ThemeView/ThemeView.native.tsx`

**Fix**: Add null checks or use optional chaining

```typescript
// Before
const value = array[0];

// After
const value = array[0];
if (value) {
  // use value
}
// Or
const value = array[0] ?? defaultValue;
```

#### 3. Unknown Type (12 errors)
**Pattern**: `Object is of type 'unknown'`

**Files affected**:
- Test files checking mock call arguments

**Fix**: Add type assertions

```typescript
// Before
expect(mockFn).toHaveBeenCalledWith(expect.any(Object));

// After
expect(mockFn).toHaveBeenCalledWith(expect.any(Object) as MyType);
```

#### 4. Unused Imports (3 errors)
**Pattern**: `'React' is declared but its value is never read`

**Files affected**:
- `src/ui/ChatBubble/ChatBubble.native.tsx`
- `src/ui/ThemeView/ThemeView.native.tsx`
- `src/ui/UserAvatar/UserAvatar.native.tsx`

**Fix**: Remove unused React imports (React 19 JSX transform doesn't need it)

```typescript
// Before
import React from 'react';

// After
// Remove if not used
```

#### 5. Other Type Issues (12 errors)
- Function signature mismatches
- Type 'never' call signature errors
- Property access issues

## 🔧 Recommended Fix Priority

### High Priority (Breaking CI)
1. **Fix Index Signature Access** - Easy fix, mechanical changes
2. **Fix Unused Imports** - Easy fix, remove React imports
3. **Fix Possibly Undefined in Production Code** - Important for safety

### Medium Priority (Test Code)
4. **Fix Test Type Assertions** - Improve test type safety
5. **Fix Possibly Undefined in Tests** - Less critical

### Low Priority (Can Wait)
6. **Refactor Complex Type Issues** - May need design changes

## 📝 Fixing Instructions

### Option 1: Fix All at Once
```bash
cd /Users/leo/Starbucks/GoAskAway/askit

# Fix each file systematically
# ... (manual fixes)

# Verify
npm run typecheck
npm run build
npm test
```

### Option 2: Gradual Migration
Temporarily disable some strict checks while fixing:

```json
// tsconfig.json
{
  "compilerOptions": {
    // Keep these enabled
    "strict": true,
    "noImplicitAny": true,

    // Temporarily disable
    "noUncheckedIndexedAccess": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

Then fix errors category by category and re-enable checks.

### Option 3: Separate PR per Category
1. PR 1: Fix index signature access
2. PR 2: Fix unused imports
3. PR 3: Fix undefined checks
4. PR 4: Fix test type assertions

## 🚀 Next Steps

1. **Decide on fix strategy** (Option 1, 2, or 3 above)
2. **Create feature branch**: `git checkout -b feat/react-19-upgrade`
3. **Fix type errors systematically**
4. **Run full test suite**: `npm test`
5. **Commit and push**: Follow same pattern as `rill`
6. **Create PR** with detailed changelog

## 📚 References

- [Rill Upgrade Commit](../rill/commit-530585f)
- [React 19 Migration Guide](https://react.dev/blog/2024/12/05/react-19)
- [TypeScript Strict Mode Guide](https://www.typescriptlang.org/tsconfig#strict)
