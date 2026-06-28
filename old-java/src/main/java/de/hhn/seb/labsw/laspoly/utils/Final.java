/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils;

public class Final<T> {
    private T val;

    public Final(T value) {
        this.val = value;
    }

    public T value() {
        return this.val;
    }

    public void set(T value) {
        this.val = value;
    }
}

