package de.hhn.labsw.laspoly.utils;

import javafx.scene.shape.MeshView;
import javafx.scene.shape.TriangleMesh;

/**
 * Helper class which contains useful methods for JavaFX 8 Shape3D nodes.
 */
public final class Shape3dUtil {
    /**
     * Creates a pyramid 3D object. The front is a face not a corner. The basline will
     * be at y= 0 and the top at the specified height.
     *
     * @param h height
     * @param w width
     * @param d depth
     * @return a mehView
     */
    public static MeshView createPyramid(final float h, final float w, final float d){
        TriangleMesh roof = new TriangleMesh();
        roof.getTexCoords().addAll(0, 0);
        roof.getPoints().addAll(
                // X, Y, Z
                0, h, 0,                    // Point 0 - Top
                -w / 2, 0, -d / 2,         // Point 1 - Links hinten
                -w / 2, 0, d / 2,          // Point 2 - links vorne
                w / 2, 0, -d / 2,          // Point 3 - Back
                w / 2, 0, d / 2            // Point 4 - Right
        );
        roof.getFaces().addAll(
                0, 0, 2, 0, 1, 0,          // Front left face
                0, 0, 1, 0, 3, 0,          // Front right face
                0, 0, 3, 0, 4, 0,          // Back right face
                0, 0, 4, 0, 2, 0,          // Back left face
                4, 0, 1, 0, 2, 0,          // Bottom rear face
                4, 0, 3, 0, 1, 0           // Bottom front face
        );
        return new MeshView(roof);
    }


    /**
     * Creates a mesh 3D object.
     * be at y= 0 and the top edges at the specified height.
     *
     * @param h height
     * @param w width
     * @param d depth
     * @return a mehView
     */
    // @formatter:off // do not remove this comment line.
    public static MeshView createFactory(final float h, final float w, final float d) {
        final float w2 = w/2f, h07 = h* 0.7f, w6 = w/6f, d2 = d/2f;
        TriangleMesh roof = new TriangleMesh();
        roof.getTexCoords().addAll(0, 0);
        roof.getPoints().addAll(
                // X, Y, Z
                -w2, 0, d2,
                w2, 0, d2,
                -w2, h07, d2,
                -w6, h07, d2,
                w6, h07, d2,
                w2, h07, d2,
                -w6, h, d2,
                w6, h, d2,
                w2, h, d2,

                -w2, 0, -d2,
                w2, 0, -d2,
                -w2, h07, -d2,
                -w6, h07, -d2,
                w6, h07, -d2,
                w2, h07, -d2,
                -w6, h, -d2,
                w6, h, -d2,
                w2, h, -d2

        );
        roof.getFaces().addAll(
                6,0,  3,0,  2,0,        // FRONT
                7,0,  4,0,  3,0,
                8,0,  5,0,  4,0,
                0,0,  2,0,  5,0,
                5,0,  1,0,  0,0,

                15,0,  12,0,  11,0,        // BACK
                16,0,  13,0,  12,0,
                17,0,  14,0,  13,0,
                9,0,  11,0,  14,0,
                9,0,  14,0,  10,0,

                11,0,  2,0,  0,0,        // LEFT
                11,0,  9,0,  0,0,

                17,0,  8,0,  1,0,        // RIGHT
                17,0,  10,0,  1,0,

                6,0,  11,0,  2,0,        // ROOF
                6,0,  11,0,  15,0,
                7,0,  12,0,  3,0,
                7,0,  12,0,  16,0,
                8,0,  13,0,  4,0,
                8,0,  13,0,  17,0,
                6,0,  12,0,  15,0,
                6,0,  12,0,  3,0,
                7,0,  13,0,  4,0,
                7,0,  13,0,  16,0




        );
        return new MeshView(roof);
    }
    // @formatter:on // do not remove this comment line.
}
