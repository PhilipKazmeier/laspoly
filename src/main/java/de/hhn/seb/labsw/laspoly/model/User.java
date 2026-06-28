/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model;

import java.util.Locale;

public class User {
    private String name;
    private Integer id;
    private Locale locale;

    public User(String userName, Locale userLocale) {
        this.locale = userLocale;
        this.name = userName;
        this.id = -1;
    }

    public final String getName() {
        return this.name;
    }

    public final void setName(String userName) {
        this.name = userName;
    }

    public final Integer getId() {
        return this.id;
    }

    public final void setId(Integer userId) {
        this.id = userId;
    }

    public final Locale getLocale() {
        return this.locale;
    }

    public final void setLocale(Locale userLocale) {
        this.locale = userLocale;
    }

    public int hashCode() {
        if (this.id != null && this.id > 0) {
            return this.id.hashCode();
        }
        if (this.name == null) {
            return 0;
        }
        return this.name.toLowerCase(Locale.ROOT).hashCode();
    }

    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || this.getClass() != o.getClass()) {
            return false;
        }
        User user = (User)o;
        if (this.id != null && this.id > 0 && user.id != null && user.id > 0) {
            return this.id.intValue() == user.id.intValue();
        }
        if (this.name == null) {
            return user.name == null;
        }
        return user.name != null && this.name.equalsIgnoreCase(user.name);
    }

    public String toString() {
        return "User{name='" + this.name + '\'' + ", id=" + this.id + ", locale=" + this.locale + '}';
    }
}

