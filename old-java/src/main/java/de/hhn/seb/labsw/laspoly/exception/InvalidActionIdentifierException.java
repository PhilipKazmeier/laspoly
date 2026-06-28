/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

public class InvalidActionIdentifierException
extends Exception {
    public InvalidActionIdentifierException(String missing) {
        super("Invalid action identifier, missing " + missing);
    }
}

