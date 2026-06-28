/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly;

import de.hhn.seb.labsw.laspoly.model.User;
import java.util.Locale;

public final class System {
    public static final User SYSTEM_USER = new User("System", Locale.ENGLISH);
    public static final User CASINO_USER = new User("CASINO", Locale.ENGLISH);

    private System() {
    }

    static {
        SYSTEM_USER.setId(-999);
        CASINO_USER.setId(-1000);
    }
}

