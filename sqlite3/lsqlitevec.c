#include "sqlite3.h"
#include "sqlite-vec.h"
#include <emscripten.h>
#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"

static int autoLoadExtension(lua_State *L)
{
    // SQLITE_API int sqlite3_auto_extension(void(*xEntryPoint)(void));
    // cast sqlite3_vec_init to void(*)(void)
    sqlite3_auto_extension((void(*)(void))sqlite3_vec_init);

    lua_pushnumber(L, 0);

    return 1;
}


// Library registration function
static const struct luaL_Reg lsqlitevec_funcs[] = {
    {"load", autoLoadExtension},
    {NULL, NULL} /* Sentinel */
};

// Initialization function
int luaopen_lsqlitevec(lua_State *L)
{
    luaL_newlib(L, lsqlitevec_funcs);
    return 1;
}