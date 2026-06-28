/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

public class WrongControllerException
extends RuntimeException {
    public WrongControllerException(String current, String expected) {
        super("Current controller is: " + current + " but should be " + expected);
    }
}

