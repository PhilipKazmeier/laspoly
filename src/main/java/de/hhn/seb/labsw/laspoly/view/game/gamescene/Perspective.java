/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import java.util.ArrayList;
import java.util.List;

public enum Perspective {
    TOP_2D(-2800, 90, 0, 180, 0, 0),
    SWAP_OFFER(-2000, -90, 0, 180, 0, 0),
    WHOLE_BOARD(-2800, 30, 0, 180, 0, 0),
    ACTION_CARD_DECK(-2000, 30, -90, 180, 0, 0),
    PROPERTY_CARDS(-1700, 15, 0, 180, -1000, 0),
    PROPERTY_CARDS2(-1700, 15, 180, 180, 1000, 0),
    PROPERTY_CARDS3(-1700, 15, 180, 180, 1000, 0),
    PROPERTY_CARDS4(-1700, 15, 180, 180, 1000, 0),
    FLY_IN_POS(-8000, 15, 0, 180, -1000, 0);

    public static final List<Perspective> PROPERTY_PERSPECTIVES;
    private final int zoom;
    private int angleX;
    private int angleY;
    private int angleZ;
    private int trX;
    private int trY;
    private int trZ;

    private Perspective(int zoomValue, int rotX, int rotY, int rotZ, int tz, int ty) {
        this.zoom = zoomValue;
        this.angleX = rotX;
        this.angleY = rotY;
        this.angleZ = rotZ;
        this.trY = ty;
        this.trZ = tz;
    }

    public int getAngleX() {
        return this.angleX;
    }

    public int getAngleY() {
        return this.angleY;
    }

    public int getAngleZ() {
        return this.angleZ;
    }

    public int getTrX() {
        return this.trX;
    }

    public int getTrY() {
        return this.trY;
    }

    public int getTrZ() {
        return this.trZ;
    }

    public int getZoom() {
        return this.zoom;
    }

    static {
        PROPERTY_PERSPECTIVES = new ArrayList<Perspective>(){
            {
                this.add(PROPERTY_CARDS);
                this.add(PROPERTY_CARDS2);
                this.add(PROPERTY_CARDS3);
                this.add(PROPERTY_CARDS4);
            }
        };
    }
}

