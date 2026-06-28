/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

public enum CameraPolicy {
    DEBUG(true, true, true){
        {
            this.setXMinAngle(-90);
            this.setXMaxAngle(90);
            this.setMaxZoom(-10000);
            this.setMinZoom(10000);
        }
    }
    ,
    DEFAULT(true, true, true),
    NO_INTERACTION(false, false, false),
    ONLY_HOR_INTERACTION(false, true, false);

    public static final int DEF_MIN_ZOOM = -1200;
    public static final int DEF_MAX_ZOOM = -4000;
    public static final int DEF_MIN_XROTATION = 10;
    public static final int DEF_MAX_XROTATION = 80;
    private final boolean allowZooming;
    private final boolean allowDragUpDown;
    private final boolean allowDragLeftRight;
    private int xMinAngle;
    private int xMaxAngle;
    private int minZoom;
    private int maxZoom;

    private CameraPolicy(boolean zoomAllowed, boolean horDragAllowed, boolean vertDragAllowed) {
        this.allowZooming = zoomAllowed;
        this.allowDragUpDown = vertDragAllowed;
        this.allowDragLeftRight = horDragAllowed;
        this.xMinAngle = 10;
        this.xMaxAngle = 80;
        this.maxZoom = -4000;
        this.minZoom = -1200;
    }

    void setXMinAngle(int xMin) {
        this.xMinAngle = xMin;
    }

    void setXMaxAngle(int xMax) {
        this.xMaxAngle = xMax;
    }

    public void setMinZoom(int minZoomValue) {
        this.minZoom = minZoomValue;
    }

    void setMaxZoom(int maxZoomValue) {
        this.maxZoom = maxZoomValue;
    }

    public boolean isHorizontalDragAllowed() {
        return this.allowDragLeftRight;
    }

    public boolean isZoomLevelAllowed(double zoom) {
        return this.allowZooming && zoom > (double)this.maxZoom && zoom < (double)this.minZoom;
    }

    public boolean isXAngleAllowed(double angle) {
        return this.isVerticalDragAllowed() && angle > (double)this.xMinAngle && angle < (double)this.xMaxAngle;
    }

    public boolean isVerticalDragAllowed() {
        return this.allowDragUpDown && this.xMinAngle != this.xMaxAngle;
    }

    public boolean isZoomingAllowed() {
        return this.allowZooming;
    }
}

