/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Animation
 *  javafx.animation.Interpolator
 *  javafx.animation.ParallelTransition
 *  javafx.animation.Transition
 *  javafx.animation.TranslateTransition
 *  javafx.scene.Node
 *  javafx.scene.PerspectiveCamera
 *  javafx.scene.input.MouseEvent
 *  javafx.scene.input.ScrollEvent
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.CameraPolicy;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.Perspective;
import javafx.animation.Animation;
import javafx.animation.Interpolator;
import javafx.animation.ParallelTransition;
import javafx.animation.Transition;
import javafx.animation.TranslateTransition;
import javafx.scene.Node;
import javafx.scene.PerspectiveCamera;
import javafx.scene.input.MouseEvent;
import javafx.scene.input.ScrollEvent;
import javafx.util.Duration;

public class PerspectiveCameraManager {
    private static final double ROTATION_SPEED = 0.3;
    private static final double DEF_CAMERA_NEAR_CLIP = 2.0;
    private static final double DEF_CAMERA_FAR_CLIP = 10000.0;
    private static final int X = 0;
    private static final int Y = 1;
    private final PerspectiveCamera camera;
    private final EnhancedGroup xyTrans;
    private final EnhancedGroup xyRot;
    private final EnhancedGroup zRot;
    private final double[] curMouse = new double[]{0.0, 0.0};
    private final double[] oldMouse = new double[]{0.0, 0.0};
    private final double[] deltaMouse = new double[]{0.0, 0.0};
    private CameraPolicy policy;
    private Perspective perspective;
    private boolean shouldInvert;

    public PerspectiveCameraManager(PerspectiveCamera cam, EnhancedGroup xyTranslation, EnhancedGroup xyRotation, EnhancedGroup zRotation) {
        this.camera = cam;
        this.xyTrans = xyTranslation;
        this.xyRot = xyRotation;
        this.zRot = zRotation;
        cam.setNearClip(2.0);
        cam.setFarClip(10000.0);
        this.setPerspective(Perspective.WHOLE_BOARD, 0);
        this.setPolicy(CameraPolicy.DEFAULT);
        zRotation.setRz(180.0);
    }

    public void setPolicy(CameraPolicy camPolicy) {
        this.policy = camPolicy;
    }

    public Perspective getPerspective() {
        return this.perspective;
    }

    public void setPerspective(Perspective newPerspective, int millis) {
        this.perspective = newPerspective;
        Duration duration = Duration.millis((double)Math.max(5, millis));
        ParallelTransition trans1 = this.makeXYRotTransition(duration, newPerspective);
        ParallelTransition trans2 = this.makeTranslateTransitions(duration, newPerspective);
        ParallelTransition animation = new ParallelTransition(new Animation[]{trans1, trans2});
        animation.setInterpolator(Interpolator.EASE_BOTH);
        animation.play();
    }

    private ParallelTransition makeTranslateTransitions(Duration time, Perspective newPerspective) {
        TranslateTransition yTransT = new TranslateTransition(time, (Node)this.xyTrans);
        TranslateTransition zoomT = new TranslateTransition(time, (Node)this.camera);
        yTransT.setToY((double)newPerspective.getTrY());
        zoomT.setToZ((double)this.perspective.getZoom());
        return new ParallelTransition(new Animation[]{yTransT, zoomT});
    }

    private ParallelTransition makeXYRotTransition(final Duration time, final Perspective newPerspective) {
        TranslateTransition zTransT = new TranslateTransition(time);
        zTransT.setToZ((double)newPerspective.getTrZ());
        Transition angleT = new Transition(){
            private final double xRotDelta;
            private final double yRotDelta;
            private final double xStart;
            private final double yStart;
            {
                this.xRotDelta = (double)newPerspective.getAngleX() - PerspectiveCameraManager.this.xyRot.getRx().getAngle() % 360.0;
                this.yRotDelta = (double)newPerspective.getAngleY() - PerspectiveCameraManager.this.xyRot.getRy().getAngle() % 360.0;
                this.xStart = PerspectiveCameraManager.this.xyRot.getRx().getAngle();
                this.yStart = PerspectiveCameraManager.this.xyRot.getRy().getAngle();
                this.setCycleDuration(time);
            }

            protected void interpolate(double frac) {
                PerspectiveCameraManager.this.xyRot.setRx(this.xStart + frac * this.xRotDelta);
                PerspectiveCameraManager.this.xyRot.setRy(this.yStart + frac * this.yRotDelta);
            }
        };
        return new ParallelTransition((Node)this.xyRot, new Animation[]{zTransT, angleT});
    }

    private void zoom(int newZoom, Duration sec2) {
        if (this.policy != null && !this.policy.isZoomLevelAllowed(newZoom)) {
            return;
        }
        TranslateTransition zoomT = new TranslateTransition(sec2, (Node)this.camera);
        zoomT.setInterpolator(Interpolator.EASE_BOTH);
        zoomT.setToZ((double)newZoom);
        zoomT.play();
    }

    public void zoomIn() {
        this.zoom((int)this.camera.getTranslateZ() + 300, Duration.millis((double)400.0));
    }

    public void zoomOut() {
        this.zoom((int)this.camera.getTranslateZ() - 300, Duration.millis((double)400.0));
    }

    public void onMousePressed(MouseEvent me, double height) {
        this.curMouse[0] = me.getSceneX();
        this.curMouse[1] = me.getSceneY();
        this.oldMouse[0] = me.getSceneX();
        this.oldMouse[1] = me.getSceneY();
        this.shouldInvert = this.curMouse[1] < height / 2.0;
    }

    public void onMouseScrolled(ScrollEvent se) {
        if (!this.policy.isZoomingAllowed()) {
            return;
        }
        double z = this.camera.getTranslateZ();
        double newZ = z + se.getDeltaY();
        if (this.policy.isZoomLevelAllowed(newZ)) {
            this.camera.setTranslateZ(newZ);
        }
    }

    public void onMouseDragged(MouseEvent me) {
        double newXAngle;
        this.oldMouse[0] = this.curMouse[0];
        this.oldMouse[1] = this.curMouse[1];
        this.curMouse[0] = me.getSceneX();
        this.curMouse[1] = me.getSceneY();
        this.deltaMouse[0] = this.curMouse[0] - this.oldMouse[0];
        this.deltaMouse[1] = this.curMouse[1] - this.oldMouse[1];
        if (this.shouldInvert) {
            this.deltaMouse[0] = -this.deltaMouse[0];
        }
        if (this.policy.isHorizontalDragAllowed()) {
            this.xyRot.getRy().setAngle(this.xyRot.getRy().getAngle() - this.deltaMouse[0] * 0.3);
        }
        if (this.policy.isXAngleAllowed(newXAngle = this.xyRot.getRx().getAngle() + this.deltaMouse[1] * 0.3)) {
            this.xyRot.getRx().setAngle(newXAngle);
        }
    }

    public void onMouseReleased(MouseEvent mouseEvent) {
        this.shouldInvert = false;
    }
}

